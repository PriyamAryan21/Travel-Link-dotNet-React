using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs.Friends;
using Server.Models.Entities;

namespace Server.Services
{
    public class FriendService : IFriendService
    {
        private readonly AppDbContext _context;
        public FriendService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<List<FriendDto>> GetFriendsAsync(Guid userId)
        {
            var requests = await _context.FriendRequests
                .Where(fr => fr.Status == "Accepted" && (fr.SenderId == userId || fr.ReceiverId == userId))
                .Include(fr => fr.Sender)
                .Include(fr => fr.Receiver)
                .ToListAsync();

            return requests.Select(fr =>
            {
                var friend = fr.SenderId == userId ? fr.Receiver : fr.Sender;
                return new FriendDto
                {
                    UserId = friend.Id,
                    Name = friend.Name,
                    Email = friend.Email,
                    ImageUrl = friend.ImageUrl
                };
            }).ToList();
        }

        public async Task<List<FriendRequestDto>> GetPendingRequestsAsync(Guid userId)
        {
            return await _context.FriendRequests
                .Where(fr => fr.ReceiverId == userId && fr.Status == "Pending")
                .Include(fr => fr.Sender)
                .Select(fr => new FriendRequestDto
                {
                    Id = fr.Id,
                    SenderId = fr.SenderId,
                    SenderName = fr.Sender.Name,
                    SenderEmail = fr.Sender.Email,
                    Status = fr.Status,
                    SentAt = fr.SentAt
                })
                .ToListAsync();
        }

        public async Task<(bool Success, string Message)> RespondToRequestAsync(Guid requestId, Guid currentUserId, string action)
        {
            var request = await _context.FriendRequests.FindAsync(requestId);
            
            if (request == null) return ((false, "Friend request not found."));

            if (request.ReceiverId != currentUserId) return ((false, "You are not authorized to respond to this request."));

            if (request.Status != "Pending") return ((false, "This request has already been responded to."));

            request.Status = action.ToLower() == "accept" ? "Accepted" : "Rejected";
            await _context.SaveChangesAsync();
            return ((true, $"Friend request {request.Status.ToLower()}"));
        }

        public async Task<(bool Success, string Message)> SendRequestAsync(Guid senderId, SendFriendRequestDto dto)
        {
            if (senderId == dto.ReceiverId)
                return ((false, "You cannot send a friend request to yourself."));

            var receiverExists = await _context.Users.FindAsync(dto.ReceiverId);
            if (receiverExists == null)
                return ((false, "User not found"));

            var existing = await _context.FriendRequests.AnyAsync(fr =>
                (fr.SenderId == senderId && fr.ReceiverId == dto.ReceiverId) ||
                (fr.SenderId == dto.ReceiverId && fr.ReceiverId == senderId));

            if (existing) return ((false, "A friend request already exists between these users"));

            var request = new FriendRequest
            {
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                Status = "Pending",
            };

            _context.FriendRequests.Add(request);
            await _context.SaveChangesAsync();

            return ((true, "Friend request sent"));
        }

        public async Task<(bool Success, string Message)> UnfriendAsync(Guid currentUserId, Guid targetUserId)
        {
            var friendship = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Status == "Accepted" &&
                ((fr.SenderId == targetUserId && fr.ReceiverId == currentUserId) ||
                fr.SenderId == currentUserId && fr.ReceiverId == targetUserId));

            if(friendship == null) return ((false, "You are not friends with this user."));

            bool unSettled = await _context.ExpenseSplits
                .AnyAsync(s => !s.IsPaid &&
                s.Expense.GroupId == null &&
                ((s.Expense.PaidByUserId == currentUserId && s.UserId == targetUserId) ||
                 (s.Expense.PaidByUserId == targetUserId && s.UserId == currentUserId)));

            if (unSettled) return ((false, "You have unsettled expenses with this user. Please settle them before unfriending."));

            _context.FriendRequests.Remove(friendship);
            await _context.SaveChangesAsync();
            return ((true, "Friend removed successfully"));
        }
    }
}
