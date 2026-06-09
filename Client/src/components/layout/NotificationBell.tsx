import { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NavLink } from 'react-router-dom';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close the dropdown if the user clicks outside of it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            {/* THE BELL BUTTON - Using our new dedicated class */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="notification-btn relative"
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md border-2 border-[var(--color-surface)]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* THE DROPDOWN PANEL */}
            {isOpen && (
                <div
                    className="absolute right-0 top-[120%] w-[320px] max-w-[90vw] glass-card z-50 animate-fade-in-up"
                    style={{
                        background: 'var(--color-surface-elevated)', // Fully opaque background for readability
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',    // Stronger drop shadow to separate it from the page
                        borderColor: 'var(--glass-border-light)'     // Slightly sharper border
                    }}
                >
                    <div className="flex items-center justify-between pb-3 mb-2 " style={{ borderColor: 'var(--glass-border)' }}>
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAllAsRead();
                                }}
                                className="text-xs hover:underline flex items-center gap-1"
                                style={{ color: 'var(--color-primary)' }}
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[60vh] overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm opacity-60">
                                No new notifications
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            if (!n.isRead) markAsRead(n.id);
                                        }}
                                        className="p-3 rounded-xl cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                                        style={{
                                            backgroundColor: !n.isRead ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                                            borderColor: !n.isRead ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                                            padding: `0.5rem`
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm pr-2 ${!n.isRead ? 'font-bold' : 'font-medium opacity-90'}`}>
                                                {n.title}
                                            </h4>
                                            {!n.isRead && (
                                                <div className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(14,165,233,0.8)]" style={{ background: 'var(--color-primary)' }} />
                                            )}
                                        </div>
                                        <p className="text-xs opacity-70 mb-2 leading-relaxed">{n.message}</p>

                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] opacity-50">
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </span>
                                            {n.link && (
                                                <NavLink
                                                    to={n.link}
                                                    onClick={() => setIsOpen(false)}
                                                    className="text-[10px] hover:underline font-medium flex items-center gap-1"
                                                    style={{ color: 'var(--color-primary)' }}
                                                >
                                                    View details &rarr;
                                                </NavLink>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

