export interface ActivityLogDto {
    id: string;
    groupId: string;
    userId: string;
    userName: string;
    actionType: string;
    description: string;
    createdAt: string;
}
export interface NotificationDto {
    id: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}