import { useEffect, useState } from "react";
import type { CreateGroupDto, FriendDto, GroupDto } from "../../types";
import friendService from "../../services/friendService";
import groupService from "../../services/groupService";
import { Loader2, Plus, Search, X, Camera } from "lucide-react";
import { toast } from "sonner";

export default function CreateGroupModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (group: GroupDto) => void;
}) {
    const [friends, setFriends] = useState<FriendDto[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<FriendDto[]>([]);

    const [form, setForm] = useState<{ name: string; description: string }>({
        name: '',
        description: '',
    });

    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    // Load friends once on mount
    useEffect(() => {
        friendService.getFriends()
            .then(setFriends)
            .catch(() => { })
            .finally(() => setLoadingFriends(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Filter friends by search query, excluding already-selected ones
    const filteredFriends = friends.filter(f =>
        !selectedFriends.some(s => s.userId === f.userId) &&
        (f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const addFriend = (friend: FriendDto) => {
        setSelectedFriends(prev => [...prev, friend]);
        setSearchQuery('');
    };

    const removeFriend = (userId: string) => {
        setSelectedFriends(prev => prev.filter(f => f.userId !== userId));
    };

    const canSubmit = form.name.trim() && !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        try {
            const dto: CreateGroupDto = {
                name: form.name.trim(),
                description: form.description.trim(),
                memberIds: selectedFriends.map(f => f.userId),
            };
            const created = await groupService.create(dto);
            
            if (coverFile) {
                try {
                    const coverData = await groupService.uploadCover(created.id, coverFile);
                    created.coverImageUrl = coverData.coverImageUrl;
                } catch {
                    toast.error("Group created, but couldn't upload the picture.");
                }
            }

            onCreated(created);
        } catch {
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create a Group</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Group Picture */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                        <div 
                            className="group-cover-preview" 
                            style={{ 
                                width: '100px', 
                                height: '100px', 
                                borderRadius: '50%', 
                                background: coverPreview ? `url(${coverPreview}) center/cover` : 'rgba(0,0,0,0.1)',
                                border: '2px dashed var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)'
                            }}
                            onClick={() => document.getElementById('group-cover-input')?.click()}
                        >
                            {!coverPreview && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                                    <Camera size={24} />
                                </div>
                            )}
                        </div>
                        <input
                            id="group-cover-input"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setCoverFile(file);
                                    setCoverPreview(URL.createObjectURL(file));
                                }
                            }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Upload Group Picture</span>
                    </div>

                    {/* Group Name */}
                    <div className="form-group">
                        <label htmlFor="name">Group Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="e.g. Weekend Warriors"
                            value={form.name}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="What's this group about?"
                            value={form.description}
                            onChange={handleChange}
                            className="input-field groups-textarea"
                            rows={3}
                        />
                    </div>

                    {/* Add Members (Friend Search) */}
                    <div className="form-group">
                        <label>Add Members</label>

                        {/* Selected friend chips */}
                        {selectedFriends.length > 0 && (
                            <div className="groups-selected-friends">
                                {selectedFriends.map(f => (
                                    <span key={f.userId} className="groups-friend-chip">
                                        {f.name}
                                        <button
                                            type="button"
                                            onClick={() => removeFriend(f.userId)}
                                            className="groups-chip-remove"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Search input */}
                        <div className="groups-search-wrapper">
                            <Search size={16} className="groups-search-icon" />
                            <input
                                type="text"
                                placeholder="Search friends by name or email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="input-field groups-search-input"
                            />
                        </div>

                        {/* Friend search results */}
                        {loadingFriends ? (
                            <div className="groups-friend-list">
                                {[1, 2].map(i => (
                                    <div key={i} className="skeleton" style={{ height: '2.5rem', borderRadius: '0.5rem' }} />
                                ))}
                            </div>
                        ) : searchQuery && filteredFriends.length > 0 ? (
                            <div className="groups-friend-list">
                                {filteredFriends.slice(0, 5).map(f => (
                                    <button
                                        key={f.userId}
                                        type="button"
                                        className="groups-friend-option"
                                        onClick={() => addFriend(f)}
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
                                        <Plus size={16} className="groups-friend-add-icon" />
                                    </button>
                                ))}
                            </div>
                        ) : searchQuery && filteredFriends.length === 0 ? (
                            <p className="groups-no-results">No friends found matching "{searchQuery}"</p>
                        ) : !searchQuery && friends.length === 0 && !loadingFriends ? (
                            <p className="groups-no-results">Add some friends first to invite them to groups</p>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!canSubmit}
                    >
                        {submitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="spin" /> Creating...
                            </span>
                        ) : (
                            `Create Group${selectedFriends.length > 0 ? ` with ${selectedFriends.length} member${selectedFriends.length > 1 ? 's' : ''}` : ''}`
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}