import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import groupService from '../../services/groupService';
import friendService from '../../services/friendService';
import type { GroupDto, CreateGroupDto, FriendDto } from '../../types';
import {
    Users,
    Plus,
    X,
    Search,
    Loader2,
    Calendar,
    Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import './groups.css';
import CreateGroupModal from '../../components/modals/CreateGroupModal';
import { getOptimizedImageUrl } from '../../utils/image';

export default function GroupsPage() {
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        groupService.getMyGroups()
            .then(setGroups)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleCreated = (newGroup: GroupDto) => {
        setGroups(prev => [...prev, newGroup]);
        setShowCreate(false);
        toast.success('Group created!');
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="groups-page">
            {/* Header */}
            <div className="groups-header">
                <div className="groups-title-area">
                    <h1 className="groups-page-title">My Groups</h1>
                    {groups.length > 0 && (
                        <span className="groups-count-badge">{groups.length}</span>
                    )}
                </div>
                <button className="groups-create-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={18} />
                    <span>New Group</span>
                </button>
            </div>

            {/* Group Cards */}
            {loading ? (
                <div className="groups-grid">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-card group-card-skeleton">
                            <div className="skeleton" style={{ height: '100px', borderRadius: '1rem 1rem 0 0' }} />
                            <div style={{ padding: '1rem' }}>
                                <div className="skeleton" style={{ height: '1.1rem', width: '60%' }} />
                                <div className="skeleton" style={{ height: '0.8rem', width: '40%', marginTop: '0.5rem' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : groups.length > 0 ? (
                <div className="groups-grid">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            className="glass-card group-list-card"
                            onClick={() => navigate(`/groups/${group.id}`)}
                        >
                            {/* Cover Image */}
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

                            {/* Body */}
                            <div className="group-list-body">
                                <h3 className="group-list-name">{group.name}</h3>

                                {group.description && (
                                    <p className="group-list-desc">{group.description}</p>
                                )}

                                <div className="group-list-meta">
                                    <span className="group-list-meta-item">
                                        <Users size={14} />
                                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="group-list-meta-item">
                                        <Calendar size={14} />
                                        {formatDate(group.createdAt)}
                                    </span>
                                </div>

                                {/* Avatar Stack */}
                                <div className="group-list-avatars">
                                    {group.members.slice(0, 4).map(m => (
                                        m.imageUrl ? (
                                            <img
                                                key={m.userId}
                                                src={getOptimizedImageUrl(m.imageUrl, 50, 50)}
                                                alt={m.userName}
                                                loading="lazy"
                                                className="group-avatar-img"
                                                title={m.userName}
                                            />
                                        ) : (
                                            <div
                                                key={m.userId}
                                                className="group-avatar-fallback"
                                                title={m.userName}
                                            >
                                                {m.userName.charAt(0).toUpperCase()}
                                            </div>
                                        )
                                    ))}
                                    {group.members.length > 4 && (
                                        <div className="group-avatar-fallback group-avatar-more">
                                            +{group.members.length - 4}
                                        </div>
                                    )}
                                </div>

                                {/* Admin badge */}
                                {group.members.some(m => m.role === 'Admin' && m.userId === group.createdByUserId) && (
                                    <div className="group-list-admin">
                                        <Crown size={12} />
                                        <span>{group.createdByName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-card groups-empty">
                    <Users size={40} className="groups-empty-icon" />
                    <p>You're not in any groups yet</p>
                    <button className="groups-empty-link" onClick={() => setShowCreate(true)}>
                        Create your first group →
                    </button>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreate && (
                <CreateGroupModal
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}
