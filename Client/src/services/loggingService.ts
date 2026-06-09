import api, { unwrap } from './api';
import type { ActivityLogDto, NotificationDto } from '../types';

export const loggingService = {
    getGroupLogs: (groupId: string) =>
        unwrap<ActivityLogDto[]>(api.get(`logging/group/${groupId}`)),

    getNotifications: (unreadOnly: boolean = false) =>
        unwrap<NotificationDto[]>(api.get(`logging/notifications?unreadOnly=${unreadOnly}`)),

    markAsRead: (id: string) =>
        unwrap<boolean>(api.post(`logging/notifications/${id}/read`)),

    markAllAsRead: () =>
        unwrap<boolean>(api.post(`logging/notifications/read-all`))
};
