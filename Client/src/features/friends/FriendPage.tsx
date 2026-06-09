import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import friendService from '../../services/friendService';
import userService from '../../services/userService';
import type { FriendDto, FriendRequestDto } from '../../types';
import type { UserProfileDto } from '../../types';
import {
    Users, UserPlus, Search, Loader2,
    UserCheck, UserX, Trash2, Wallet, Mail,
    Clock, CheckCircle2, XCircle
} from 'lucide-react';
import './friends.css';
import { getOptimizedImageUrl } from '../../utils/image';

type Tab = 'friends' | 'requests' | 'find';

export default function FriendsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('friends');

    /* ── My Friends ── */
    const [friends, setFriends] = useState<FriendDto[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(true);

    /* ── Pending Requests ── */
    const [requests, setRequests] = useState<FriendRequestDto[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(true);

    /* ── Find People ── */
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfileDto[]>([]);
    const [searching, setSearching] = useState(false);

    /* ── Action Loading (per-item) ── */
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    /* ═══════════════════════════════════════
       Data Loaders
       ═══════════════════════════════════════ */
    const loadFriends = useCallback(async () => {
        setFriendsLoading(true);
        try {
            const data = await friendService.getFriends();
            setFriends(data);
        } catch { /* handled by unwrap */ }
        finally { setFriendsLoading(false); }
    }, []);

    const loadRequests = useCallback(async () => {
        setRequestsLoading(true);
        try {
            const data = await friendService.getPendingRequests();
            setRequests(data);
        } catch { /* handled by unwrap */ }
        finally { setRequestsLoading(false); }
    }, []);

    useEffect(() => {
        loadFriends();
        loadRequests();
    }, [loadFriends, loadRequests]);

    /* ═══════════════════════════════════════
       Actions
       ═══════════════════════════════════════ */
    const handleUnfriend = async (userId: string) => {
        setActionLoadingId(userId);
        try {
            await friendService.unfriend(userId);
            setFriends(prev => prev.filter(f => f.userId !== userId));
            toast.success('Friend removed');
        } catch { /* handled */ }
        finally { setActionLoadingId(null); }
    };

    const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
        setActionLoadingId(requestId);
        try {
            await friendService.repondToRequest(requestId, action);
            setRequests(prev => prev.filter(r => r.id !== requestId));
            toast.success(action === 'accept' ? 'Friend request accepted!' : 'Request declined');
            if (action === 'accept') loadFriends();
        } catch { /* handled */ }
        finally { setActionLoadingId(null); }
    };

    const handleSendRequest = async (receiverId: string) => {
        setActionLoadingId(receiverId);
        try {
            await friendService.sendRequest({ receiverId });
            toast.success('Friend request sent!');
            // Mark as sent in search results visually
            setSearchResults(prev =>
                prev.map(u => u.id === receiverId ? { ...u, _sent: true } as any : u)
            );
        } catch { /* handled */ }
        finally { setActionLoadingId(null); }
    };

    const handleSearch = useCallback(async (queryOverride?: string) => {
        const query = queryOverride ?? searchQuery;
        if (!query.trim() || query.trim().length < 3) {
            toast.info('Please enter at least 3 characters to search');
            return;
        }
        setSearching(true);
        try {
            const data = await userService.searchUsers(query.trim());
            // Filter out self and existing friends
            const friendIds = new Set(friends.map(f => f.userId));
            const filtered = data.filter(u => u.id !== user?.userId && !friendIds.has(u.id));
            setSearchResults(filtered);
        } catch { /* handled */ }
        finally { setSearching(false); }
    }, [searchQuery, friends, user?.userId]);

    useEffect(() => {
        if (searchQuery.trim().length >= 3) {
            setSearching(true);
            const timer = setTimeout(() => {
                handleSearch(searchQuery);
            }, 1500);
            return () => clearTimeout(timer);
        } else {
            setSearching(false);
            if (searchQuery.trim().length === 0) {
                setSearchResults([]);
            }
        }
    }, [searchQuery, handleSearch]);

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    /* ═══════════════════════════════════════
       Avatar Helper
       ═══════════════════════════════════════ */
    const Avatar = ({ name, imageUrl, size = 44 }: { name: string; imageUrl?: string | null; size?: number }) => {
        if (imageUrl) {
            return <img src={getOptimizedImageUrl(imageUrl, size, size)} alt={name} loading="lazy" className="user-avatar-img" style={{ width: size, height: size }} />;
        }
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        return (
            <div className="user-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.35 }}>
                {initials}
            </div>
        );
    };

    /* ═══════════════════════════════════════
       Tab Content Renderers
       ═══════════════════════════════════════ */
    const renderFriendsTab = () => {
        if (friendsLoading) return <LoadingSpinner />;
        if (friends.length === 0) return (
            <EmptyState
                icon={<Users size={40} />}
                title="No friends yet"
                subtitle="Start by searching for people you know in the 'Find People' tab"
            />
        );
        return (
            <div className="friends-grid">
                {friends.map(f => (
                    <div key={f.userId} className="glass-card friend-card">
                        <div className="friend-card-main" onClick={() => navigate(`/profile/${f.userId}`)} style={{ cursor: 'pointer' }}>
                            <Avatar name={f.name} imageUrl={f.imageUrl} />
                            <div className="friend-card-info">
                                <h3 className="friend-name hover-underline">{f.name}</h3>
                                <span className="friend-email"><Mail size={13} /> {f.email}</span>
                            </div>
                        </div>
                        <div className="friend-card-actions">
                            <button
                                className="friend-action-btn action-expenses"
                                onClick={() => navigate(`/expenses/user/${f.userId}`)}
                                title="View expenses"
                            >
                                <Wallet size={16} /> Expenses
                            </button>
                            <button
                                className="friend-action-btn action-remove"
                                onClick={() => handleUnfriend(f.userId)}
                                disabled={actionLoadingId === f.userId}
                                title="Remove friend"
                            >
                                {actionLoadingId === f.userId
                                    ? <Loader2 size={16} className="spin" />
                                    : <Trash2 size={16} />
                                }
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderRequestsTab = () => {
        if (requestsLoading) return <LoadingSpinner />;
        if (requests.length === 0) return (
            <EmptyState
                icon={<Clock size={40} />}
                title="No pending requests"
                subtitle="When someone sends you a friend request, it will show up here"
            />
        );
        return (
            <div className="friends-grid">
                {requests.map(r => (
                    <div key={r.id} className="glass-card friend-card request-card">
                        <div className="friend-card-main">
                            <div className="user-avatar-fallback" style={{ width: 44, height: 44, fontSize: 15 }}>
                                {r.senderName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="friend-card-info">
                                <h3 className="friend-name">{r.senderName}</h3>
                                <span className="friend-email"><Mail size={13} /> {r.senderEmail}</span>
                                <span className="request-time">
                                    <Clock size={12} /> {new Date(r.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="friend-card-actions">
                            <button
                                className="friend-action-btn action-accept"
                                onClick={() => handleRespond(r.id, 'accept')}
                                disabled={actionLoadingId === r.id}
                            >
                                {actionLoadingId === r.id
                                    ? <Loader2 size={16} className="spin" />
                                    : <><CheckCircle2 size={16} /> Accept</>
                                }
                            </button>
                            <button
                                className="friend-action-btn action-reject"
                                onClick={() => handleRespond(r.id, 'reject')}
                                disabled={actionLoadingId === r.id}
                            >
                                <XCircle size={16} /> Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderFindTab = () => (
        <>
            {/* Search Bar */}
            <div className="friends-search-bar">
                <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        className="input-field search-input"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                </div>
            </div>

            {/* Results */}
            {searching ? (
                <LoadingSpinner />
            ) : searchQuery.trim().length > 0 && searchQuery.trim().length < 3 ? (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--color-text-muted)' }}>
                    Please enter at least 3 characters to search...
                </div>
            ) : searchResults.length > 0 ? (
                <div className="friends-grid">
                    {searchResults.map(u => {
                        const alreadySent = (u as any)._sent === true;
                        return (
                            <div key={u.id} className="glass-card friend-card">
                                <div className="friend-card-main" onClick={() => navigate(`/profile/${u.id}`)} style={{ cursor: 'pointer' }}>
                                    <Avatar name={u.name} imageUrl={u.imageUrl} />
                                    <div className="friend-card-info">
                                        <h3 className="friend-name hover-underline">{u.name}</h3>
                                        <span className="friend-email"><Mail size={13} /> {u.email}</span>
                                    </div>
                                </div>
                                <div className="friend-card-actions">
                                    {alreadySent ? (
                                        <span className="request-sent-badge">
                                            <UserCheck size={16} /> Sent
                                        </span>
                                    ) : (
                                        <button
                                            className="friend-action-btn action-add"
                                            onClick={() => handleSendRequest(u.id)}
                                            disabled={actionLoadingId === u.id}
                                        >
                                            {actionLoadingId === u.id
                                                ? <Loader2 size={16} className="spin" />
                                                : <><UserPlus size={16} /> Add Friend</>
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : searchQuery.trim() ? (
                <EmptyState
                    icon={<Search size={40} />}
                    title="No results found"
                    subtitle={`No users found for "${searchQuery}"`}
                />
            ) : (
                <EmptyState
                    icon={<UserPlus size={40} />}
                    title="Find new friends"
                    subtitle="Search by name or email to connect with people"
                />
            )}
        </>
    );

    /* ═══════════════════════════════════════
       Render
       ═══════════════════════════════════════ */
    return (
        <div className="friends-page">
            {/* Header */}
            <div className="friends-header">
                <h1 className="friends-title">
                    <Users size={24} /> Friends
                </h1>
                <p className="friends-subtitle">Manage your connections and find new travel buddies</p>
            </div>

            {/* Tabs */}
            <div className="friends-tabs">
                <button
                    className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    <UserCheck size={16} /> My Friends
                    {friends.length > 0 && <span className="tab-count">{friends.length}</span>}
                </button>
                <button
                    className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    <Clock size={16} /> Requests
                    {requests.length > 0 && <span className="tab-count tab-count-warn">{requests.length}</span>}
                </button>
                <button
                    className={`friends-tab ${activeTab === 'find' ? 'active' : ''}`}
                    onClick={() => setActiveTab('find')}
                >
                    <Search size={16} /> Find People
                </button>
            </div>

            {/* Tab Content */}
            <div className="friends-content">
                {activeTab === 'friends' && renderFriendsTab()}
                {activeTab === 'requests' && renderRequestsTab()}
                {activeTab === 'find' && renderFindTab()}
            </div>
        </div>
    );
}

/* ── Shared Sub-components ── */
function LoadingSpinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '30vh' }}>
            <div className="spin"><Loader2 size={32} /></div>
        </div>
    );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="friends-empty">
            <div style={{ color: 'var(--color-primary)', opacity: 0.7 }}>{icon}</div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
        </div>
    );
}
