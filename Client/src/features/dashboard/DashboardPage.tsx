import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tripService } from '../../services/tripService';
import groupService from '../../services/groupService';
import friendService from '../../services/friendService';
import type { TripDto, GroupDto, FriendRequestDto } from '../../types';
import {
    Plane,
    Users,
    UserPlus,
    MapPin,
    Calendar,
    Clock,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import './Dashboard.css';
import CreateTripModal from '../../components/modals/CreateTripModal';
import AddMemberModal from '../../components/modals/AddMemberModal';
import CreateGroupModal from '../../components/modals/CreateGroupModal';
import { getOptimizedImageUrl } from '../../utils/image';

export default function DashboardPage() {
    const { user } = useAuth();
    const [showCreateTrip, setShowCreateTrip] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    const [trips, setTrips] = useState<TripDto[]>([]);
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequestDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fire all 3 API calls in parallel — if one fails the others still resolve
        Promise.allSettled([
            tripService.getMyTrips(),
            groupService.getMyGroups(),
            friendService.getPendingRequests(),
        ]).then(([tripsResult, groupsResult, friendsResult]) => {
            if (tripsResult.status === 'fulfilled') setTrips(tripsResult.value);
            if (groupsResult.status === 'fulfilled') setGroups(groupsResult.value);
            if (friendsResult.status === 'fulfilled') setFriendRequests(friendsResult.value);
            setLoading(false);
        });
    }, []);

    // ── Greeting based on time of day ──
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };
    console.log("Friend Requests:" + friendRequests);
    console.log("Groups:" + groups);
    console.log("Trips:" + trips);
    console.log("Loading:" + loading);
    // ── Filter upcoming trips (endDate > today), sort nearest first ──
    const upcomingTrips = trips
        .filter(t => new Date(t.endDate) >= new Date())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3);

    // ── Helper: days until trip starts ──
    const getDaysUntil = (dateStr: string) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Happening now';
        if (diff === 0) return 'Starts today';
        if (diff === 1) return 'Tomorrow';
        return `In ${diff} days`;
    };

    // ── Format date like "Jun 12" ──
    const formatShortDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="dashboard">
            {/* ── Hero Greeting ── */}
            <section className="dashboard-hero glass-card">
                <div className="dashboard-hero-content">
                    <h1 className="dashboard-greeting">
                        {getGreeting()}, <span className="dashboard-name">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="dashboard-subtitle">
                        {upcomingTrips.length > 0
                            ? `You have ${upcomingTrips.length} upcoming trip${upcomingTrips.length > 1 ? 's' : ''}. Let's plan!`
                            : `Ready to plan your next adventure?`
                        }
                    </p>
                </div>
                <div className="dashboard-hero-icon">
                    <Sparkles size={48} />
                </div>
            </section>

            {/* ── Quick Actions ── */}
            <section className="dashboard-actions">
                <button onClick={() => setShowCreateTrip(true)} className="dashboard-action-btn glass-card">
                    <div className="action-icon action-icon-trips"><Plane size={22} /></div>
                    <span>New Trip</span>
                </button>
                <button onClick={() => setShowCreateGroup(true)} className="dashboard-action-btn glass-card">
                    <div className="action-icon action-icon-groups"><Users size={22} /></div>
                    <span>New Group</span>
                </button>
                <NavLink to="/friends" className="dashboard-action-btn glass-card">
                    <div className="action-icon action-icon-friends">
                        <UserPlus size={22} />
                        {friendRequests.length > 0 && (
                            <span className="action-badge">{friendRequests.length > 99 ? "99+" : friendRequests.length}</span>
                        )}
                    </div>
                    <span>Friends</span>
                </NavLink>
            </section>

            {/* ── Upcoming Trips ── */}
            {loading ? (
                <section className="dashboard-section">
                    <h2 className="dashboard-section-title">Upcoming Trips</h2>
                    <div className="dashboard-trips-grid">
                        {[1, 2].map(i => (
                            <div key={i} className="glass-card trip-card-skeleton">
                                <div className="skeleton" style={{ height: '1.25rem', width: '60%' }} />
                                <div className="skeleton" style={{ height: '0.9rem', width: '40%', marginTop: '0.5rem' }} />
                                <div className="skeleton" style={{ height: '0.9rem', width: '80%', marginTop: '0.5rem' }} />
                            </div>
                        ))}
                    </div>
                </section>
            ) : upcomingTrips.length > 0 ? (
                <section className="dashboard-section">
                    <div className="dashboard-section-header">
                        <h2 className="dashboard-section-title">Upcoming Trips</h2>
                        <NavLink to="/trips" className="dashboard-see-all">
                            See all <ChevronRight size={16} />
                        </NavLink>
                    </div>
                    <div className="dashboard-trips-grid">
                        {upcomingTrips.map(trip => (
                            <NavLink key={trip.id} to={`/trips/${trip.id}`} className="glass-card trip-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="trip-card-header">
                                    <div className="trip-card-destination">
                                        <MapPin size={16} className="trip-icon" />
                                        <h3>{trip.destination}</h3>
                                    </div>
                                    <span className="trip-card-badge">{getDaysUntil(trip.startDate)}</span>
                                </div>
                                <p className="trip-card-name">{trip.name}</p>
                                <div className="trip-card-meta">
                                    <span className="trip-card-dates">
                                        <Calendar size={14} />
                                        {formatShortDate(trip.startDate)} — {formatShortDate(trip.endDate)}
                                    </span>
                                    <span className="trip-card-group">
                                        <Users size={14} />
                                        {trip.groupName}
                                    </span>
                                </div>
                            </NavLink>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="dashboard-section">
                    <h2 className="dashboard-section-title">Upcoming Trips</h2>
                    <div className="glass-card dashboard-empty">
                        <Plane size={32} className="dashboard-empty-icon" />
                        <p>No trips planned yet</p>
                        <NavLink to="/trips" className="dashboard-empty-link">Plan your first trip →</NavLink>
                    </div>
                </section>
            )}

            {/* ── Your Groups ── */}
            {loading ? (
                <section className="dashboard-section">
                    <h2 className="dashboard-section-title">Your Groups</h2>
                    <div className="dashboard-groups-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card group-card-skeleton">
                                <div className="skeleton" style={{ height: '1rem', width: '70%' }} />
                                <div className="skeleton" style={{ height: '0.8rem', width: '50%', marginTop: '0.5rem' }} />
                            </div>
                        ))}
                    </div>
                </section>
            ) : groups.length > 0 ? (
                <section className="dashboard-section">
                    <div className="dashboard-section-header">
                        <h2 className="dashboard-section-title">Your Groups</h2>
                        <NavLink to="/groups" className="dashboard-see-all">
                            See all <ChevronRight size={16} />
                        </NavLink>
                    </div>
                    <div className="dashboard-groups-grid">
                        {groups.slice(0, 6).map(group => (
                            <NavLink key={group.id} to={`/groups/${group.id}`} className="glass-card group-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                {group.coverImageUrl ? (
                                    <div
                                        className="group-card-cover"
                                        style={{ backgroundImage: `url(${getOptimizedImageUrl(group.coverImageUrl, 400, 200)})` }}
                                    />
                                ) : (
                                    <div className="group-card-cover" style={{
                                        backgroundImage: 'linear-gradient(135deg, rgba(235, 118, 8, 0.3), rgba(196, 230, 28, 0.3))',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}>
                                        <Users size={18} />
                                    </div>
                                )}
                                <div className="group-card-body">
                                    <h3 className="group-card-name">{group.name}</h3>
                                    <div className="group-card-meta">
                                        <Users size={14} />
                                        <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    {/* Member avatar stack */}
                                    <div className="group-card-avatars">
                                        {group.members.slice(0, 4).map((m, idx) => (
                                            m.imageUrl ? (
                                                <img
                                                    key={m.userId}
                                                    src={getOptimizedImageUrl(m.imageUrl, 50, 50)}
                                                    alt={m.userName}
                                                    loading="lazy"
                                                    className="group-avatar-img"
                                                    style={{ zIndex: 4 - idx }}
                                                />
                                            ) : (
                                                <div
                                                    key={m.userId}
                                                    className="group-avatar-fallback"
                                                    style={{ zIndex: 4 - idx }}
                                                >
                                                    {m.userName.charAt(0)}
                                                </div>
                                            )
                                        ))}
                                        {group.members.length > 4 && (
                                            <div className="group-avatar-fallback group-avatar-more" style={{ zIndex: 0 }}>
                                                +{group.members.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </NavLink>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="dashboard-section">
                    <h2 className="dashboard-section-title">Your Groups</h2>
                    <div className="glass-card dashboard-empty">
                        <Users size={32} className="dashboard-empty-icon" />
                        <p>No groups yet</p>
                        <NavLink to="/groups" className="dashboard-empty-link">Create your first group →</NavLink>
                    </div>
                </section>
            )}

            {/* ── Pending Friend Requests ── */}
            {!loading && friendRequests.length > 0 && (
                <section className="dashboard-section">
                    <div className="dashboard-section-header">
                        <h2 className="dashboard-section-title">
                            Friend Requests
                            <span className="dashboard-count-badge">{friendRequests.length}</span>
                        </h2>
                        <NavLink to="/friends" className="dashboard-see-all">
                            View all <ChevronRight size={16} />
                        </NavLink>
                    </div>
                    <div className="dashboard-friend-requests">
                        {friendRequests.slice(0, 3).map(req => (
                            <div key={req.id} className="glass-card friend-request-card">
                                <div className="friend-request-avatar">
                                    {req.senderName.charAt(0)}
                                </div>
                                <div className="friend-request-info">
                                    <h4>{req.senderName}</h4>
                                    <p>{req.senderEmail}</p>
                                </div>
                                <div className="friend-request-time">
                                    <Clock size={12} />
                                    <span>{formatShortDate(req.sentAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {/* Create Trip Modal */}
            {showCreateTrip && (
                <CreateTripModal
                    onClose={() => setShowCreateTrip(false)}
                    onCreated={() => {
                        tripService.getMyTrips().then(setTrips)
                        setShowCreateTrip(false);
                    }}
                />
            )}

            {/* Create Group Modal */}
            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onCreated={(newGroup) => {
                        setGroups(prev => [...prev, newGroup]); // Add to dashboard list
                        setShowCreateGroup(false);
                    }}
                />
            )}

        </div>
    );
}
