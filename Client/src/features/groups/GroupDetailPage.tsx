import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AddExpenseModal from '../../components/modals/AddExpenseModal';
import groupService from '../../services/groupService';
import { tripService } from '../../services/tripService';
import friendService from '../../services/friendService';
import type { GroupDto, GroupMemberDto, TripDto, FriendDto } from '../../types';
import {
    ArrowLeft,
    Users,
    Crown,
    MapPin,
    Calendar,
    Camera,
    UserMinus,
    LogOut,
    UserPlus,
    Search,
    Plus,
    X,
    Loader2,
    Plane,
    Shield,
    Wallet,
    Receipt,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import './groups.css';
import AddMemberModal from '../../components/modals/AddMemberModal';
import ActivityLogModal from '../../components/modals/ActivityLogModal';
import CreateTripModal from '../../components/modals/CreateTripModal';
import { getOptimizedImageUrl } from '../../utils/image';

export default function GroupDetailPage() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [group, setGroup] = useState<GroupDto | null>(null);
    const [trips, setTrips] = useState<TripDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [showActivityLog, setShowActivityLog] = useState(false);
    const [showCreateTrip, setShowCreateTrip] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        actionType: 'leaveGroup' | 'removeMember' | null;
        targetId?: string;
        targetName?: string;
    }>({ isOpen: false, title: '', message: '', actionType: null });

    const coverInputRef = useRef<HTMLInputElement>(null);

    // ── Fetch group + trips in parallel ──
    useEffect(() => {
        if (!groupId) return;

        Promise.allSettled([
            groupService.getById(groupId),
            tripService.getTripsByGroup(groupId),
        ]).then(([groupResult, tripsResult]) => {
            if (groupResult.status === 'fulfilled') setGroup(groupResult.value);
            if (tripsResult.status === 'fulfilled') setTrips(tripsResult.value);
        }).finally(() => setLoading(false));
    }, [groupId]);

    // ── Derived state ──
    const isAdmin = group?.members.some(
        m => m.userId === user?.userId && m.role === 'Admin'
    ) ?? false;

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatShortDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // ── Cover upload handler ──
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !groupId) return;

        setUploadingCover(true);
        try {
            const result = await groupService.uploadCover(groupId, file);
            setGroup(prev => prev ? { ...prev, coverImageUrl: result.coverImageUrl } : prev);
            toast.success('Cover updated!');
        } catch {
            toast.error('Failed to upload cover');
        } finally {
            setUploadingCover(false);
            // Reset input so the same file can be re-selected
            if (coverInputRef.current) coverInputRef.current.value = '';
        }
    };

    // ── Leave group ──
    const handleLeaveClick = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Leave Group?',
            message: 'Are you sure you want to leave this group? You will lose access to all trips and expenses associated with this group.',
            actionType: 'leaveGroup'
        });
    };

    const executeLeaveGroup = async () => {
        if (!groupId) return;
        try {
            await groupService.leave(groupId);
            toast.success('You left the group');
            navigate('/groups');
        } catch {
            /* unwrap already toasts */
        }
    };

    // ── Remove member (admin only) ──
    const handleRemoveMemberClick = (targetUserId: string, targetName: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Remove Member?',
            message: `Are you sure you want to remove ${targetName} from this group?`,
            actionType: 'removeMember',
            targetId: targetUserId,
            targetName: targetName
        });
    };

    const executeRemoveMember = async (targetUserId: string, targetName: string) => {
        if (!groupId) return;
        try {
            await groupService.removeMember(groupId, targetUserId);
            setGroup(prev => prev ? {
                ...prev,
                members: prev.members.filter(m => m.userId !== targetUserId),
            } : prev);
            toast.success(`${targetName} removed`);
        } catch {
            /* unwrap already toasts */
        }
    };

    const handleConfirmAction = async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        if (confirmConfig.actionType === 'leaveGroup') {
            await executeLeaveGroup();
        } else if (confirmConfig.actionType === 'removeMember' && confirmConfig.targetId) {
            await executeRemoveMember(confirmConfig.targetId, confirmConfig.targetName || 'Member');
        }
    };

    // ── Member added callback ──
    const handleMemberAdded = (updatedGroup: GroupDto) => {
        setGroup(updatedGroup);
        setShowAddMember(false);
        toast.success('Member added!');
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="group-detail">
                <div className="skeleton" style={{ height: '200px', borderRadius: '1.25rem' }} />
                <div className="skeleton" style={{ height: '1.5rem', width: '50%', marginTop: '1rem' }} />
                <div className="skeleton" style={{ height: '1rem', width: '30%', marginTop: '0.5rem' }} />
            </div>
        );
    }

    // ── Not found ──
    if (!group) {
        return (
            <div className="group-detail" >
                <button className="group-detail-back" style={{ zIndex: '1' }} onClick={() => navigate('/groups')}>
                    <ArrowLeft size={18} /> Back to Groups
                </button>
                <div className="glass-card groups-empty" style={{ zIndex: '1' }}>
                    <Users size={40} className="groups-empty-icon" />
                    <p>Group not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="group-detail" >
            {/* Back button */}
            <button className="group-detail-back" style={{ zIndex: '1' }} onClick={() => navigate('/groups')}>
                <ArrowLeft size={18} /> Back to Groups
            </button>
            {/* ── Cover Hero ── */}
            <div
                className="group-detail-hero"
                style={{
                    backgroundImage: group.coverImageUrl
                        ? `url(${group.coverImageUrl})`
                        : 'linear-gradient(135deg, rgba(235, 118, 8, 0.3), rgba(196, 230, 28, 0.3))'
                }}
            >
                <div className="group-detail-hero-overlay">
                    <div className="group-detail-hero-content">
                        <h1 className="group-detail-name">{group.name}</h1>
                        {group.description && (
                            <p className="group-detail-desc">{group.description}</p>
                        )}
                        <div className="group-detail-hero-meta">
                            <span><Users size={14} /> {group.members.length} members</span>
                            <span><Calendar size={14} /> Created {formatDate(group.createdAt)}</span>
                        </div>
                    </div>

                    {/* Cover upload button (admin only) */}
                    {isAdmin && (
                        <button
                            className="group-detail-cover-btn"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploadingCover}
                        >
                            {uploadingCover ? <Loader2 size={16} className="spin" /> : <Camera size={16} />}
                        </button>
                    )}
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            {/* ── Actions Bar ── */}
            <div className="group-detail-actions" style={{ zIndex: '1' }}>
                {isAdmin && (
                    <button className="group-action-btn group-action-add" onClick={() => setShowAddMember(true)}>
                        <UserPlus size={16} /> Add Member
                    </button>
                )}

                <button className="group-action-btn group-action-add" onClick={() => setShowActivityLog(true)}>
                    <Activity size={16} /> Timeline
                </button>

                <button className="group-action-btn group-action-add" onClick={() => setShowAddExpense(true)}>
                    <Receipt size={16} /> Add Expense
                </button>

                <NavLink to={`/expenses/group/${groupId}`} className="group-action-btn group-action-add" style={{ textDecoration: 'none' }}>
                    <Wallet size={16} /> Expenses
                </NavLink>
                <button className="group-action-btn group-action-leave" onClick={handleLeaveClick}>
                    <LogOut size={16} /> Leave Group
                </button>
            </div>


            {/* ── Members Section ── */}
            <section className="group-detail-section">
                <h2 className="group-detail-section-title" style={{ zIndex: '1' }}>
                    <Users size={18} /> Members
                    <span className="groups-count-badge">{group.members.length}</span>
                </h2>

                <div className="group-members-list">
                    {group.members
                        .sort((a, b) => (a.role === 'Admin' ? -1 : 1) - (b.role === 'Admin' ? -1 : 1))
                        .map(member => (
                            <div key={member.userId} className="glass-card group-member-card">
                                {/* Avatar */}
                                {member.imageUrl ? (
                                    <img
                                        src={getOptimizedImageUrl(member.imageUrl, 100, 100)}
                                        alt={member.userName}
                                        loading="lazy"
                                        className="group-member-avatar"
                                    />
                                ) : (
                                    <div className="group-member-avatar-fallback">
                                        {member.userName.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="group-member-info">
                                    <div className="group-member-name-row">
                                        <span className="group-member-name">{member.userName}</span>
                                        {member.role === 'Admin' && (
                                            <span className="group-role-badge group-role-admin">
                                                <Crown size={10} /> Admin
                                            </span>
                                        )}
                                        {member.role !== 'Admin' && (
                                            <span className="group-role-badge group-role-member">
                                                <Shield size={10} /> Member
                                            </span>
                                        )}
                                    </div>
                                    <span className="group-member-email">{member.email}</span>
                                </div>

                                {/* Remove button (admin only, can't remove self) */}
                                {isAdmin && member.userId !== user?.userId && (
                                    <button
                                        className="group-member-remove"
                                        onClick={() => handleRemoveMemberClick(member.userId, member.userName)}
                                        title={`Remove ${member.userName}`}
                                    >
                                        <UserMinus size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                </div>
            </section>

            {/* ── Trips by this Group ── */}
            <section className="group-detail-section">
                <h2 className="group-detail-section-title">
                    <Plane size={18} /> Trips
                    {trips.length > 0 && (
                        <span className="groups-count-badge">{trips.length}</span>
                    )}
                </h2>

                {trips.length > 0 ? (
                    <div className="group-trips-grid">
                        {trips.map(trip => (
                            <NavLink
                                key={trip.id}
                                to={`/trips/${trip.id}`}
                                className="glass-card trip-card"
                                style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="trip-card-header">
                                    <div className="trip-card-destination">
                                        <MapPin size={16} className="trip-icon" />
                                        <h3>{trip.destination}</h3>
                                    </div>
                                    {trip.hasItinerary && (
                                        <span className="trip-card-badge">📋 Itinerary</span>
                                    )}
                                </div>
                                <p className="trip-card-name">{trip.name}</p>
                                <div className="trip-card-meta">
                                    <span className="trip-card-dates">
                                        <Calendar size={14} />
                                        {formatShortDate(trip.startDate)} — {formatShortDate(trip.endDate)}
                                    </span>
                                </div>
                            </NavLink>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card groups-empty" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <Plane size={32} className="groups-empty-icon" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <p style={{ margin: 0 }}>No trips planned for this group yet</p>
                            <button
                                className="btn-primary"
                                onClick={() => setShowCreateTrip(true)}
                                style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Plus size={16} /> Add Trip
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* ── Add Member Modal ── */}
            {showAddMember && groupId && (
                <AddMemberModal
                    groupId={groupId}
                    existingMemberIds={group.members.map(m => m.userId)}
                    onClose={() => setShowAddMember(false)}
                    onAdded={handleMemberAdded}
                />
            )}

            {showActivityLog && groupId && (
                <ActivityLogModal
                    groupId={groupId}
                    onClose={() => setShowActivityLog(false)}
                />
            )}


            {/* ── Add Expense Modal ── */}
            {showAddExpense && groupId && (
                <AddExpenseModal
                    preselectedGroupId={groupId}
                    initialTab="group"
                    onClose={() => setShowAddExpense(false)}
                    onAdded={() => setShowAddExpense(false)}
                />
            )}

            {/* ── Create Trip Modal ── */}
            {showCreateTrip && groupId && (
                <CreateTripModal
                    initialGroupId={groupId}
                    onClose={() => setShowCreateTrip(false)}
                    onCreated={() => {
                        setShowCreateTrip(false);
                        tripService.getTripsByGroup(groupId).then(setTrips);
                    }}
                />
            )}

            {/* ── Confirm Modal ── */}
            {confirmConfig.isOpen && (
                <div className="modal-overlay" onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: 'var(--color-danger)', marginBottom: '1rem' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>{confirmConfig.title}</h2>
                        <p className="text-muted" style={{ marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            {confirmConfig.message}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--glass-bg)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--color-danger)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                {confirmConfig.actionType === 'leaveGroup' ? 'Leave' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
