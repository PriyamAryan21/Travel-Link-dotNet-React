using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Server.Common;
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
        public async Task<ServiceResult<List<FriendDto>>> GetFriendsAsync(Guid userId)
        {
            var requests = await _context.FriendRequests
                .Where(fr => fr.Status == "Accepted" && (fr.SenderId == userId || fr.ReceiverId == userId))
                .Include(fr => fr.Sender)
                .Include(fr => fr.Receiver)
                .ToListAsync();

            var result = requests.Select(fr =>
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
            return new ServiceResult<List<FriendDto>>
            {
                Success = true,
                Data = result
            };
        }

        public async Task<ServiceResult<List<FriendRequestDto>>> GetPendingRequestsAsync(Guid userId)
        {
            var result = await _context.FriendRequests
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

            return new ServiceResult<List<FriendRequestDto>>
            {
                Success = true,
                Data = result
            };
        }

        public async Task<ServiceResult<(bool Success, string Message)>> RespondToRequestAsync(Guid requestId, Guid currentUserId, string action)
        {
            var request = await _context.FriendRequests.FindAsync(requestId);
            
            if (request == null) return ServiceResult<(bool Success, string Message)>.Fail("Friend request not found.");
            if (request.ReceiverId != currentUserId) return ServiceResult<(bool Success, string Message)>.Fail("You are not authorized to respond to this request.");

            if (request.Status != "Pending") return ServiceResult<(bool Success, string Message)>.Fail("This request has already been responded to.");

            request.Status = action.ToLower() == "accept" ? "Accepted" : "Rejected";
            await _context.SaveChangesAsync();
            return ServiceResult<(bool Success, string Message)>.Ok((true, $"Friend request {request.Status.ToLower()}"));
        }

        public async Task<ServiceResult<(bool Success, string Message)>> SendRequestAsync(Guid senderId, SendFriendRequestDto dto)
        {
            if (senderId == dto.ReceiverId)
                return ServiceResult<(bool Success, string Message)>.Fail("You cannot send a friend request to yourself.");

            var receiverExists = await _context.Users.FindAsync(dto.ReceiverId);
            if (receiverExists == null)
                return ServiceResult<(bool Success, string Message)>.Fail("User not found");
            var existing = await _context.FriendRequests.AnyAsync(fr =>
                (fr.SenderId == senderId && fr.ReceiverId == dto.ReceiverId) ||
                (fr.SenderId == dto.ReceiverId && fr.ReceiverId == senderId));

            if (existing) return ServiceResult<(bool Success, string Message)>.Fail("A friend request already exists between these users");

            var request = new FriendRequest
            {
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                Status = "Pending",
            };

            _context.FriendRequests.Add(request);
            await _context.SaveChangesAsync();

            return ServiceResult<(bool Success, string Message)>.Ok((true, "Friend request sent"));
        }

        public async Task<ServiceResult<(bool Success, string Message)>> UnfriendAsync(Guid currentUserId, Guid targetUserId)
        {
            var friendship = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Status == "Accepted" &&
                ((fr.SenderId == targetUserId && fr.ReceiverId == currentUserId) ||
                fr.SenderId == currentUserId && fr.ReceiverId == targetUserId));

            if(friendship == null) return ServiceResult<(bool Success, string Message)>.Fail("You are not friends with this user.");

            bool unSettled = await _context.ExpenseSplits
                .AnyAsync(s => !s.IsPaid &&
                s.Expense.GroupId == null &&
                ((s.Expense.PaidByUserId == currentUserId && s.UserId == targetUserId) ||
                 (s.Expense.PaidByUserId == targetUserId && s.UserId == currentUserId)));

            if (unSettled) return ServiceResult<(bool Success, string Message)>.Fail("You have unsettled expenses with this user. Please settle them before unfriending.");

            _context.FriendRequests.Remove(friendship);
            await _context.SaveChangesAsync();
            var result = new ServiceResult<(bool Success, string Message)>
            {
                Success = true,
                Message = "Unfriended successfully",
                Data = (true, "Unfriended successfully")
            };
            return result;
        }
    }
}
