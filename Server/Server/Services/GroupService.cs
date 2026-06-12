using Microsoft.EntityFrameworkCore;
using Server.Common;
using Server.Data;
using Server.DTOs.Groups;
using Server.Models.Entities;

namespace Server.Services
{
    public class GroupService : IGroupService
    {
        private readonly AppDbContext _db;
        private readonly ILoggingService _loggingService;
        public GroupService(AppDbContext db, ILoggingService loggingService)
        {
            _db = db;
            _loggingService = loggingService;
        }
        public async Task<ServiceResult<bool>> AddMemberAsync(Guid groupId, Guid requesterId, Guid newMemberId)
        {
            var requester = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == requesterId);
            if (requester == null || requester.Role != "Admin") return ServiceResult<bool>.Fail("You are not authorized to add members.");

            var alreadyMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == newMemberId);

            if(alreadyMember) return ServiceResult<bool>.Fail("User is already a member of the group.");

            _db.GroupMembers.Add(new GroupMember
            {
                GroupId = groupId,
                UserId = newMemberId,
                Role = "Member"
            });

            await _db.SaveChangesAsync();

            // --- LOGGING & NOTIFICATIONS ---
            var targetUser = await _db.Users.FindAsync(newMemberId);
            var group = await _db.Groups.FindAsync(groupId);
            if (targetUser != null && group != null)
            {
                await _loggingService.LogGroupActivityAsync(groupId, requesterId, "MEMBER_ADDED", $"added {targetUser.Name} to the group");
                await _loggingService.SendNotificationAsync(newMemberId, "Added to Group", $"You were added to the group '{group.Name}'", $"/groups/{groupId}");
            }


            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<GroupDto>> CreateGroupAsync(Guid userId, CreateGroupDto dto)
        {
            var group = new Group
            {
                Name = dto.Name,
                Description = dto.Description,
                CoverImageUrl = dto.CoverImageUrl,
                CreatedByUserId = userId,
            };

            _db.Groups.Add(group);

            _db.GroupMembers.Add(new GroupMember
            {
                GroupId = group.Id,
                UserId = userId,
                Role = "Admin"
            });
                
            foreach(var memberId in dto.MemberIds.Distinct())
            {
                if (memberId == userId) continue;
                _db.GroupMembers.Add(new GroupMember
                {
                    GroupId = group.Id,
                    UserId = memberId,
                    Role = "Member"
                });
            }

            await _db.SaveChangesAsync();

            var result = await GetGroupByIdAsync(group.Id, userId) ?? throw new Exception("Group creation failed");
            return ServiceResult<GroupDto>.Ok(result.Data!);
        }

        public async Task<ServiceResult<GroupDto?>> GetGroupByIdAsync(Guid groupId, Guid userId)
        {
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId);
            
            if(!isMember) return ServiceResult<GroupDto?>.Fail("You are not a member of this group.");

            var group = await _db.Groups
                .Include(g => g.CreatedBy)
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            
            return group == null ? ServiceResult<GroupDto?>.Fail("Group not found.") : ServiceResult<GroupDto?>.Ok(MapToDto(group));
        }

        public async Task<ServiceResult<List<GroupDto>>> GetMyGroupAsync(Guid userId)
        {
            var result = await _db.Groups
                .Where(g => g.Members.Any(m => m.UserId == userId))
                .Include(g => g.CreatedBy)
                .Include(g => g.Members).ThenInclude(m => m.User)
                .Select(g => MapToDto(g))
                .ToListAsync();
            return ServiceResult<List<GroupDto>>.Ok(result);
        }

        public async Task<ServiceResult<bool>> LeaveGroupAsync(Guid groupId, Guid userId)
        {
            var member = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);

            if(member == null) return ServiceResult<bool>.Fail("You are not a member of this group.");

            if(member.Role == "Admin")
            {
                var otherAdmins = await _db.GroupMembers
                    .AnyAsync(m => m.GroupId == groupId && m.UserId != userId && m.Role == "Admin");

                if (!otherAdmins)
                {
                    var nextMember = await _db.GroupMembers
                        .Where(m => m.GroupId == groupId && m.UserId != userId)
                        .OrderBy(m => m.JoinedAt)
                        .FirstOrDefaultAsync();
                    if (nextMember != null)
                    {
                        nextMember.Role = "Admin";
                    }
                }
            }
            _db.GroupMembers.Remove(member);

            var remainingCount = await _db.GroupMembers
                .CountAsync(m => m.GroupId == groupId);

            if (remainingCount <= 1)
            {
                var group = await _db.Groups.FindAsync(groupId);
                if (group != null)
                {
                    var trips = await _db.Trips.Where(t => t.GroupId == groupId).ToListAsync();
                    _db.Trips.RemoveRange(trips);
                    
                    _db.Groups.Remove(group);
                }
            }

            await _db.SaveChangesAsync();

            var user = await _db.Users.FindAsync(userId);
            // --- LOGGING ---
            if (remainingCount > 1)
            {
                await _loggingService.LogGroupActivityAsync(groupId, userId, "MEMBER_LEFT", $"{user?.Name} left the group");
            }

            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<bool>> RemoveMemberAsync(Guid groupId, Guid requesterId, Guid targetUserId)
        {
            var requester = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == requesterId);

            if(requester == null || requester.Role != "Admin") return ServiceResult<bool>.Fail("You are not an admin of this group.");

            if(requesterId == targetUserId) return ServiceResult<bool>.Fail("You cannot remove yourself.");

            var target = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == targetUserId);

            if(target == null) return ServiceResult<bool>.Fail("Target user is not a member of this group.");

            _db.GroupMembers.Remove(target);
            await _db.SaveChangesAsync();

            //LOGGING & NOTIFICATIONS
            var targetUser = await _db.Users.FindAsync(targetUserId);
            var group = await _db.Groups.FindAsync(groupId);
            if (targetUser != null && group != null)
            {
                await _loggingService.LogGroupActivityAsync(groupId, requesterId, "MEMBER_REMOVED", $"Admin removed {targetUser.Name} from the group");
                await _loggingService.SendNotificationAsync(targetUserId, "Removed from Group", $"You were removed from the group '{group.Name}'");
            }


            return ServiceResult<bool>.Ok(true);
        }

        private static GroupDto MapToDto(Group g) => new GroupDto
        {
            Id = g.Id,
            Name = g.Name,
            Description = g.Description,
            CoverImageUrl = g.CoverImageUrl,
            CreatedAt = g.CreatedAt,
            CreatedByUserId = g.CreatedByUserId,
            CreatedByName = g.CreatedBy?.Name ?? String.Empty,
            Members = g.Members.Select(m => new GroupMemberDto
            {
                UserId = m.UserId,
                UserName = m.User?.Name ?? String.Empty,
                Email = m.User?.Email ?? String.Empty,
                Role = m.Role,
                ProfilePictureUrl = m.User?.ImageUrl,
                JoinedAt = m.JoinedAt
            }).ToList()
        };
    }
}
