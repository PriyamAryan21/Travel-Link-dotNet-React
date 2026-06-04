using Server.Common;
using Server.DTOs.Groups;

namespace Server.Services
{
    public interface IGroupService
    {
        Task<ServiceResult<GroupDto>> CreateGroupAsync(Guid userId, CreateGroupDto dto);
        Task<ServiceResult<List<GroupDto>>> GetMyGroupAsync(Guid userId);
        Task<ServiceResult<bool>> AddMemberAsync(Guid groupId, Guid requesterId, Guid newMemberId);
        Task<ServiceResult<bool>> LeaveGroupAsync(Guid groupId, Guid userId);
        Task<ServiceResult<bool>> RemoveMemberAsync(Guid groupId, Guid requesterId, Guid targetUserId);
        Task<ServiceResult<GroupDto?>> GetGroupByIdAsync(Guid groupId, Guid userId);
    }
}
