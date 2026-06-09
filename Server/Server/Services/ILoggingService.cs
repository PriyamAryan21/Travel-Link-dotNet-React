using Server.DTOs.Logging;

namespace Server.Services
{
    public interface ILoggingService
    {
        // Activity Logs
        Task LogGroupActivityAsync(Guid groupId, Guid userId, string actionType, string description);
        Task<IEnumerable<ActivityLogDto>> GetGroupLogsAsync(Guid groupId, int count = 50);

        // Notifications
        Task SendNotificationAsync(Guid userId, string title, string message, string? link = null);
        Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task MarkAllAsReadAsync(Guid userId);
    }
}
