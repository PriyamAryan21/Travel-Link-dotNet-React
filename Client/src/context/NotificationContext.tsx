import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { getToken } from '../services/api';
import { loggingService } from '../services/loggingService';
import type { NotificationDto } from '../types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '../services/api';

interface NotificationContextType {
    notifications: NotificationDto[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    hubConnection: signalR.HubConnection | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);


const HUB_URL = API_BASE_URL.replace('/api', '') + '/hubs/location';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
    const { isAuthenticated } = useAuth();

    const fetchNotifications = async () => {
        try {
            const data = await loggingService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            return;
        }

        // Fetch initial history
        fetchNotifications();

        // Establish SignalR connection
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => getToken() || ''
            })
            .withAutomaticReconnect()
            .build();

        // Listen for new alerts!
        connection.on("ReceiveNotification", (notification: NotificationDto) => {
            setNotifications(prev => [notification, ...prev]);

            // Pop a toast on screen when a new notification arrives
            toast(notification.title, {
                description: notification.message,
                duration: 6000,
            });
        });

        connection.start()
            .then(() => setHubConnection(connection))
            .catch(err => console.error("SignalR Connection Error: ", err));

        return () => {
            connection.stop();
        };
    }, [isAuthenticated]);

    const markAsRead = async (id: string) => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        try {
            await loggingService.markAsRead(id);
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
            await loggingService.markAllAsRead();
        } catch (error) {
            console.error(error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, hubConnection }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
    return context;
};
