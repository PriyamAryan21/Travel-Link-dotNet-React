import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import './OfflineOverlay.css';

export default function OfflineOverlay() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="offline-overlay">
            <div className="glass-card offline-card">
                <WifiOff size={48} className="offline-icon" />
                <h2 className="offline-title">Looks like you're offline!</h2>
                <p className="offline-subtitle">
                    Please check your internet connection to continue planning your adventures.
                </p>
                <div className="offline-pulse-container">
                    <div className="offline-pulse"></div>
                    <span>Waiting for connection...</span>
                </div>
            </div>
        </div>
    );
}
