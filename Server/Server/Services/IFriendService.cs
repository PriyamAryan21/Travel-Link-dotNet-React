using Server.DTOs.Friends;

namespace Server.Services
{
    public interface IFriendService
    {
        Task<(bool Success, string Message)> SendRequestAsync(Guid senderId, SendFriendRequestDto dto);
        Task<(bool Success, string Message)> RespondToRequestAsync(Guid requestId, Guid currentUserId, string action);
        Task<List<FriendRequestDto>> GetPendingRequestsAsync(Guid userId);
        Task<List<FriendDto>> GetFriendsAsync(Guid userId);
        Task<(bool Success, string Message)> UnfriendAsync(Guid currentUserId, Guid targetUserId);

    }
}
