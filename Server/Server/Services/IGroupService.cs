using Server.DTOs.Groups;

namespace Server.Services
{
    public interface IGroupService
    {
        Task<GroupDto> CreateGroupAsync(Guid userId, CreateGroupDto dto);
        Task<List<GroupDto>> GetMyGroupAsync(Guid userId);
        Task<bool> AddMemberAsync(Guid groupId, Guid requesterId, Guid newMemberId);
        Task<bool> LeaveGroupAsync(Guid groupId, Guid userId);
        Task<bool> RemoveMemberAsync(Guid groupId, Guid requesterId, Guid targetUserId);
        Task<GroupDto?> GetGroupByIdAsync(Guid groupId, Guid userId);
    }
}
