import { useEffect, useState } from "react";
import type { FriendDto, GroupDto } from "../../types";
import friendService from "../../services/friendService";
import groupService from "../../services/groupService";
import { Loader2, Plus, Search, X } from "lucide-react";

export default function AddMemberModal({
    groupId,
    existingMemberIds,
    onClose,
    onAdded,
}: {
    groupId: string;
    existingMemberIds: string[];
    onClose: () => void;
    onAdded: (updatedGroup: GroupDto) => void;
}) {
    const [friends, setFriends] = useState<FriendDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        friendService.getFriends()
            .then(setFriends)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Only show friends not already in the group
    const availableFriends = friends.filter(
        f => !existingMemberIds.includes(f.userId)
    );

    const filteredFriends = availableFriends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAdd = async (friendId: string) => {
        setAdding(friendId);
        try {
            const updatedGroup = await groupService.addMember(groupId, friendId);
            onAdded(updatedGroup);
        } catch {
            /* unwrap already toasts */
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Member</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-form">
                    {/* Search */}
                    <div className="groups-search-wrapper">
                        <Search size={16} className="groups-search-icon" />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="input-field groups-search-input"
                            autoFocus
                        />
                    </div>

                    {/* Friend list */}
                    {loading ? (
                        <div className="groups-friend-list">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton" style={{ height: '3rem', borderRadius: '0.75rem' }} />
                            ))}
                        </div>
                    ) : availableFriends.length === 0 ? (
                        <p className="groups-no-results">
                            All your friends are already in this group, or you have no friends to add.
                        </p>
                    ) : filteredFriends.length === 0 ? (
                        <p className="groups-no-results">No friends matching "{searchQuery}"</p>
                    ) : (
                        <div className="groups-friend-list">
                            {filteredFriends.map(f => (
                                <button
                                    key={f.userId}
                                    type="button"
                                    className="groups-friend-option"
                                    onClick={() => handleAdd(f.userId)}
                                    disabled={adding === f.userId}
                                >
                                    {f.imageUrl ? (
                                        <img src={f.imageUrl} alt={f.name} className="groups-friend-avatar" />
                                    ) : (
                                        <div className="groups-friend-avatar-fallback">
                                            {f.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="groups-friend-info">
                                        <span className="groups-friend-name">{f.name}</span>
                                        <span className="groups-friend-email">{f.email}</span>
                                    </div>
                                    {adding === f.userId ? (
                                        <Loader2 size={16} className="spin" />
                                    ) : (
                                        <Plus size={16} className="groups-friend-add-icon" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}