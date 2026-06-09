using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs.Location;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace Server.Hubs
{
    [Authorize]
    public class CentralHub : Hub
    {
        private static readonly ConcurrentDictionary<Guid, string> _activeSessions = new();
        private static readonly ConcurrentDictionary<string, Guid> _connectionToUser = new();
        private readonly AppDbContext _db;

        public CentralHub(AppDbContext db)
        {
            _db = db;
        }
        private Guid getUserId() => Guid.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private static string GroupSessionName(Guid groupId) => $"location-group-{groupId}";
        private static string PrivateSessionName(Guid userA, Guid userB)
        {
            var ids = new[] { userA, userB }.OrderBy(id => id).ToArray();
            return $"location-private-{ids[0]}-{ids[1]}"; 
        }

        private async Task LeaveCurrentSessionAsync(Guid userId)
        {
            if (_activeSessions.TryRemove(userId, out var groupName)) await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task JoinGroupSession(Guid groupId)
        {
            var userId = getUserId();
            var isMember = await _db.GroupMembers.AnyAsync(m => m.GroupId == groupId && m.UserId == userId);

            if (!isMember) {
                await Clients.Caller.SendAsync("Error", "You are not a member of this group.");
                return;    
            }

            await LeaveCurrentSessionAsync(userId);

            var sessionName = GroupSessionName(groupId);

            await Groups.AddToGroupAsync(Context.ConnectionId, sessionName);

            _activeSessions[userId] = sessionName;
            _connectionToUser[Context.ConnectionId] = userId;

            await Clients.OthersInGroup(sessionName).SendAsync("UserJoined", userId);
        }


        public async Task JoinPrivateSession(Guid targetUserId)
        {
            var userId = getUserId();

            if(userId == targetUserId)
            {
                await Clients.Caller.SendAsync("Error", "You cannot share location with yourself");
                return;
            }

            var areFriends = await _db.FriendRequests.AnyAsync(f =>
                f.Status == "Accepted" &&
                ((f.SenderId == userId && f.ReceiverId == targetUserId) || 
                (f.SenderId == targetUserId && f.ReceiverId == userId)));

            if (!areFriends)
            {
                await Clients.Caller.SendAsync("Error", "You can only share location with friends.");
                return;
            }

            await LeaveCurrentSessionAsync(userId);

            var sessionName = PrivateSessionName(userId, targetUserId);

            await Groups.AddToGroupAsync(Context.ConnectionId, sessionName);
            _activeSessions[userId] = sessionName;
            _connectionToUser[Context.ConnectionId] = userId;

            await Clients.OthersInGroup(sessionName).SendAsync("UserJoined", userId);
        }

        public async Task SendLocation(LocationUpdateDto location)
        {
            var userId = getUserId();
            if (!_activeSessions.TryGetValue(userId, out var sessionName))
            {
                await Clients.Caller.SendAsync("Error", "You are not in a location sharing session.");
                return;
            }
            location.UserId = userId;
            location.Timestamp = DateTime.UtcNow;
            await Clients.OthersInGroup(sessionName).SendAsync("LocationUpdate", location);
        }

        public async Task LeaveSession()
        {
            var userId = getUserId();
            await LeaveCurrentSessionAsync(userId);

            _connectionToUser.TryRemove(Context.ConnectionId, out _);

            await Clients.Caller.SendAsync("SessionLeft", "You have left the location session");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if(_connectionToUser.TryRemove(Context.ConnectionId, out var userId))
            {
                if (_activeSessions.TryRemove(userId, out var sessionName))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionName);

                    await Clients.OthersInGroup(sessionName).SendAsync("UserLeft", userId);
                }
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
