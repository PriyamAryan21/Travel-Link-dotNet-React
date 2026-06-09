import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import userService from '../../services/userService';
import type { UserProfileDetailDto } from '../../types';
import {
    User, Calendar, Users, MapPin, Loader2,
    ShieldCheck, ArrowLeft, Briefcase, Camera, Receipt
} from 'lucide-react';
import './profile.css';
import { getOptimizedImageUrl } from '../../utils/image';

export default function ProfilePage() {
    const { userId } = useParams();
    const { user: currentUser, updateUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfileDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOwnProfile = !userId || userId === currentUser?.userId;

    useEffect(() => {
        setLoading(true);
        userService.getProfileDetail(userId)
            .then(setProfile)
            .catch(() => { /* handled by unwrap toast */ })
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="spin"><Loader2 size={32} /></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="glass-card profile-empty">
                <User size={48} className="profile-empty-icon" />
                <h2>Profile Not Found</h2>
                <button className="btn btn-primary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
                    Go Back
                </button>
            </div>
        );
    }

    const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const Avatar = ({ name, imageUrl, size = 120 }: { name: string; imageUrl?: string | null; size?: number }) => {
        if (imageUrl) {
            return <img src={getOptimizedImageUrl(imageUrl, size, size)} alt={name} loading="lazy" className="profile-avatar-img" style={{ width: size, height: size }} />;
        }
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        return (
            <div className="profile-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.35 }}>
                {initials}
            </div>
        );
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploadingAvatar(true);
        try {
            const data = await userService.uploadAvatar(file);
            const cacheBustedUrl = `${data.imageUrl}?t=${Date.now()}`;
            setProfile(prev => prev ? { ...prev, imageUrl: cacheBustedUrl } : null);
            updateUser({ imageUrl: cacheBustedUrl }); // Update global state
            toast.success('Profile picture updated successfully!');
        } catch (error) {
            toast.error('Failed to update profile picture');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="profile-page">
            {/* Header Section */}
            <div className="glass-card profile-header-card">
                {!isOwnProfile && (
                    <button className="profile-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} /> Back
                    </button>
                )}

                <div className="profile-hero">
                    <div className="profile-avatar-container">
                        <Avatar name={profile.name} imageUrl={profile.imageUrl} />
                        {isOwnProfile && (
                            <>
                                <button 
                                    className="profile-avatar-upload-btn" 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    title="Change profile picture"
                                >
                                    {uploadingAvatar ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </>
                        )}
                    </div>
                    <div className="profile-hero-info">
                        <h1 className="profile-name">
                            {profile.name}
                            {isOwnProfile && (
                                <span title="This is you" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    <ShieldCheck size={20} className="profile-verified-icon" />
                                </span>
                            )}

                        </h1>
                        <p className="profile-email">{profile.email}</p>
                        <p className="profile-joined">
                            <Calendar size={14} /> Joined {joinDate}
                        </p>
                        {profile.isFriend && (
                            <button 
                                className="btn btn-primary" 
                                style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={() => navigate(`/expenses/user/${profile.id}`)}
                            >
                                <Receipt size={16} /> Check Expenses
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="profile-stats">
                    <div className="profile-stat-box">
                        <span className="stat-value">{profile.totalFriends}</span>
                        <span className="stat-label">Friends</span>
                    </div>
                    {!isOwnProfile && (
                        <div className="profile-stat-box">
                            <span className="stat-value">{profile.mutualFriends}</span>
                            <span className="stat-label">Mutual Friends</span>
                            {profile.mutualFriendsList?.length > 0 && (
                                <div className="mutual-friends-avatars">
                                    {profile.mutualFriendsList.map(mf => (
                                        <div key={mf.id} className="mutual-friend-avatar-wrapper" onClick={() => navigate(`/profile/${mf.id}`)}>
                                            <Avatar name={mf.name} imageUrl={mf.imageUrl} size={26} />
                                            <span className="mutual-friend-tooltip">{mf.name}</span>
                                        </div>
                                    ))}
                                    {profile.mutualFriends > 5 && (
                                        <div className="mutual-friend-overflow">
                                            +{profile.mutualFriends - 5}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="profile-stat-box">
                        <span className="stat-value">{profile.createdTrips.length}</span>
                        <span className="stat-label">Trips Organized</span>
                    </div>
                    <div className="profile-stat-box">
                        <span className="stat-value">{profile.createdGroups.length}</span>
                        <span className="stat-label">Groups Created</span>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="profile-content-grid">

                {/* Trips Organized */}
                <div className="profile-section">
                    <h2 className="profile-section-title">
                        <MapPin size={20} /> Trips Organized
                    </h2>
                    {profile.createdTrips.length === 0 ? (
                        <div className="profile-empty-list">
                            <MapPin size={24} />
                            <p>No trips organized yet</p>
                        </div>
                    ) : (
                        <div className="profile-items-grid">
                            {profile.createdTrips.map(trip => (
                                <div key={trip.id} className="glass-card profile-item-card">
                                    <div className="profile-item-header">
                                        <h3 className="profile-item-name">{trip.name}</h3>
                                        <span className="profile-item-date">
                                            {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="profile-item-meta">
                                        <MapPin size={14} /> {trip.destination}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Groups Created */}
                <div className="profile-section">
                    <h2 className="profile-section-title">
                        <Users size={20} /> Groups Created
                    </h2>
                    {profile.createdGroups.length === 0 ? (
                        <div className="profile-empty-list">
                            <Users size={24} />
                            <p>No groups created yet</p>
                        </div>
                    ) : (
                        <div className="profile-items-grid">
                            {profile.createdGroups.map(group => (
                                <div key={group.id} className="glass-card profile-item-card">
                                    <div className="profile-item-header">
                                        <h3 className="profile-item-name">{group.name}</h3>
                                    </div>
                                    <p className="profile-item-meta">
                                        <Users size={14} /> {group.memberCount} members
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
