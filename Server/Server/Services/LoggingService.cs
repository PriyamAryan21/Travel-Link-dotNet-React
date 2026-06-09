using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs.Logging;
using Server.Hubs;
using Server.Models.Entities;

namespace Server.Services
{
    public class LoggingService : ILoggingService
    {
        private readonly AppDbContext _db;
        private readonly IHubContext<CentralHub> _hubContext;

        public LoggingService(AppDbContext db, IHubContext<CentralHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        public async Task LogGroupActivityAsync(Guid groupId, Guid userId, string actionType, string description)
        {
            var log = new ActivityLog
            {
                GroupId = groupId,
                UserId = userId,
                ActionType = actionType,
                Description = description
            };

            _db.ActivityLogs.Add(log);
            await _db.SaveChangesAsync();
        }

        public async Task<IEnumerable<ActivityLogDto>> GetGroupLogsAsync(Guid groupId, int count = 50)
        {
            return await _db.ActivityLogs
                .Include(a => a.User)
                .Where(a => a.GroupId == groupId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(count)
                .Select(a => new ActivityLogDto
                {
                    Id = a.Id,
                    GroupId = a.GroupId,
                    UserId = a.UserId,
                    UserName = a.User.Name,
                    ActionType = a.ActionType,
                    Description = a.Description,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();
        }

        public async Task SendNotificationAsync(Guid userId, string title, string message, string? link = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Link = link
            };

            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            var dto = new NotificationDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                Link = notification.Link,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };

            await _hubContext.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", dto);
        }

        public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false)
        {
            var query = _db.Notifications.Where(n => n.UserId == userId);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Message = n.Message,
                    Link = n.Link,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);
            if (notification != null)
            {
                notification.IsRead = true;
                await _db.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            var unread = await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            foreach (var n in unread) n.IsRead = true;
            await _db.SaveChangesAsync();
        }
    }
}
