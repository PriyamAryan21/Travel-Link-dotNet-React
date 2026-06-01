using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs.Groups;
using Server.Models.Entities;

namespace Server.Services
{
    public class GroupService : IGroupService
    {
        private readonly AppDbContext _db;
        public GroupService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<bool> AddMemberAsync(Guid groupId, Guid requesterId, Guid newMemberId)
        {
            var requester = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == requesterId);
            if (requester == null || requester.Role != "Admin") return false;

            var alreadyMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == newMemberId);

            if(alreadyMember) return false;

            _db.GroupMembers.Add(new GroupMember
            {
                GroupId = groupId,
                UserId = newMemberId,
                Role = "Member"
            });

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<GroupDto> CreateGroupAsync(Guid userId, CreateGroupDto dto)
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

            return await GetGroupByIdAsync(group.Id, userId) ?? throw new Exception("Group creation failed");
        }

        public async Task<GroupDto?> GetGroupByIdAsync(Guid groupId, Guid userId)
        {
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId);
            
            if(!isMember) return null;

            var group = await _db.Groups
                .Include(g => g.CreatedBy)
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            
            return group == null ? null : MapToDto(group);
        }

        public async Task<List<GroupDto>> GetMyGroupAsync(Guid userId)
        {
            return await _db.Groups
                .Where(g => g.Members.Any(m => m.UserId == userId))
                .Include(g => g.CreatedBy)
                .Include(g => g.Members).ThenInclude(m => m.User)
                .Select(g => MapToDto(g))
                .ToListAsync();
        }



        public async Task<bool> LeaveGroupAsync(Guid groupId, Guid userId)
        {
            var member = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);

            if(member == null) return false;

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
                    _db.Groups.Remove(group);
                }
            }

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveMemberAsync(Guid groupId, Guid requesterId, Guid targetUserId)
        {
            var requester = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == requesterId);

            if(requester == null || requester.Role != "Admin") return false;

            if(requesterId == targetUserId) return false;

            var target = await _db.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == targetUserId);

            if(target == null) return false;

            _db.GroupMembers.Remove(target);
            await _db.SaveChangesAsync();
            return true;
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
                JoinedAt = m.JoinedAt
            }).ToList()
        };
    }
}
