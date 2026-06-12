import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Moon, Shield } from 'lucide-react';
import './settings.css';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    
    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1 className="settings-title">App Settings</h1>
                <p className="settings-subtitle">Manage your preferences and app behavior.</p>
            </div>

            {/* Appearance Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">
                    <Moon size={24} className="icon-primary" /> Appearance
                </h2>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Theme Preference</span>
                            <span className="setting-description">Choose how the app looks.</span>
                        </div>
                        <div className="setting-action">
                            <select 
                                className="setting-select"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                            >
                                <option value="light">Light Mode</option>
                                <option value="dark">Dark Mode</option>
                                <option value="system">System Default</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">
                    <Bell size={24} className="icon-primary" /> Notifications
                </h2>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Push Notifications</span>
                            <span className="setting-description">Receive alerts on your device for trip updates.</span>
                        </div>
                        <div className="setting-action">
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={pushEnabled} 
                                    onChange={(e) => setPushEnabled(e.target.checked)} 
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Email Notifications</span>
                            <span className="setting-description">Receive daily summaries and important alerts via email.</span>
                        </div>
                        <div className="setting-action">
                            <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={emailEnabled} 
                                    onChange={(e) => setEmailEnabled(e.target.checked)} 
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account & Security Section */}
            <div className="settings-section danger-zone">
                <h2 className="settings-section-title">
                    <Shield size={24} /> Account Security
                </h2>
                <div className="settings-list">
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-label">Data Privacy</span>
                            <span className="setting-description">Request a copy of your data or delete your account.</span>
                        </div>
                        <div className="setting-action">
                            <button 
                                className="btn-danger" 
                                onClick={() => alert("This feature will be available later.")}
                            >
                                Manage Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
