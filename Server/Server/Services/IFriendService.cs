using Server.Common;
using Server.DTOs.Friends;

namespace Server.Services
{
    public interface IFriendService
    {
        Task<ServiceResult<(bool Success, string Message)>> SendRequestAsync(Guid senderId, SendFriendRequestDto dto);
        Task<ServiceResult<(bool Success, string Message)>> RespondToRequestAsync(Guid requestId, Guid currentUserId, string action);
        Task<ServiceResult<List<FriendRequestDto>>> GetPendingRequestsAsync(Guid userId);
        Task<ServiceResult<List<FriendDto>>> GetFriendsAsync(Guid userId);
        Task<ServiceResult<(bool Success, string Message)>> UnfriendAsync(Guid currentUserId, Guid targetUserId);
    }
}
