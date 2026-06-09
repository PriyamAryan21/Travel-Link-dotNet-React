import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Receipt, Check, Loader2, User, Users, AlertTriangle } from "lucide-react";
import expenseService from "../../services/expenseService";
import groupService from "../../services/groupService";
import friendService from "../../services/friendService";
import type { CreateExpenseDto, ExpenseDto, GroupDto, GroupMemberDto, FriendDto } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

interface AddExpenseModalProps {
    preselectedGroupId?: string;
    initialTab?: 'personal' | 'group';
    onClose: () => void;
    onAdded: (expense: ExpenseDto) => void;
}

export default function AddExpenseModal({
    preselectedGroupId,
    initialTab = 'personal',
    onClose,
    onAdded
}: AddExpenseModalProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Modal Context State
    const [activeTab, setActiveTab] = useState<'personal' | 'group'>(preselectedGroupId ? 'group' : initialTab);

    // Form State
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState<number | "">("");
    const [category, setCategory] = useState("Food");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    // Group & Friend State
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [friends, setFriends] = useState<FriendDto[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>(preselectedGroupId || "");
    const [groupMembers, setGroupMembers] = useState<GroupMemberDto[]>([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

    // Split State
    const [splitType, setSplitType] = useState<"Equal" | "Exact" | "Percentage">("Equal");
    const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
    const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
    const [percentages, setPercentages] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Fetch initial data
    useEffect(() => {
        groupService.getMyGroups().then(setGroups).catch(() => { });

        friendService.getFriends().then(setFriends).catch(() => { });
    }, [preselectedGroupId]);

    // Fetch members when group changes
    useEffect(() => {
        if (activeTab === 'group' && selectedGroupId) {
            groupService.getById(selectedGroupId).then(g => {
                setGroupMembers(g.members);
                setSelectedParticipantIds(g.members.map(m => m.userId));
            });
        }
    }, [selectedGroupId, activeTab]);

    // Build the dynamic "Members" list based on the active tab
    const activeMembers: { userId: string, userName: string, imageUrl?: string | null }[] = activeTab === 'group'
        ? groupMembers.map(m => ({ userId: m.userId, userName: m.userName, imageUrl: m.imageUrl }))
        : [
            { userId: user?.userId || '', userName: 'You', imageUrl: user?.imageUrl },
            ...friends.filter(f => selectedFriendIds.includes(f.userId)).map(f => ({ userId: f.userId, userName: f.name, imageUrl: f.imageUrl }))
        ];

    // Ensure selected participants align with active members
    useEffect(() => {
        if (activeTab === 'personal') {
            setSelectedParticipantIds([user?.userId || '', ...selectedFriendIds]);
        }
    }, [activeTab, selectedFriendIds, user]);

    const toggleParticipant = (userId: string) => {
        setSelectedParticipantIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const toggleFriendSelection = (friendId: string) => {
        setSelectedFriendIds(prev =>
            prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
        );
    };

    const numericAmount = Number(amount) || 0;

    const getPreview = () => {
        if (!selectedParticipantIds.length || numericAmount <= 0) return [];

        return selectedParticipantIds.map(userId => {
            const member = activeMembers.find(m => m.userId === userId);
            const name = member?.userId === user?.userId ? "You" : member?.userName || "Unknown";
            let owed = 0;

            if (splitType === "Equal") {
                owed = numericAmount / selectedParticipantIds.length;
            } else if (splitType === "Exact") {
                owed = Number(exactAmounts[userId]) || 0;
            } else if (splitType === "Percentage") {
                const pct = Number(percentages[userId]) || 0;
                owed = (numericAmount * pct) / 100;
            }

            return { userId, name, imageUrl: member?.imageUrl, owed };
        });
    };

    const previewSplits = getPreview();
    const totalComputed = previewSplits.reduce((sum, s) => sum + s.owed, 0);
    const isTotalValid = splitType === "Equal" || Math.abs(totalComputed - numericAmount) < 0.01;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount) return toast.error("Please fill required fields");
        if (activeTab === 'group' && !selectedGroupId) return toast.error("Please select a group");
        if (activeTab === 'personal' && selectedFriendIds.length === 0) return toast.error("Please select at least one friend");
        if (!isTotalValid) return toast.error(`Splits must add up to ₹${numericAmount.toFixed(2)}`);

        setSubmitting(true);
        try {
            const dto: CreateExpenseDto = {
                title: title.trim(),
                description: "",
                amount: numericAmount,
                category,
                date,
                groupId: activeTab === 'group' ? selectedGroupId : undefined, // Empty string if personal
                splitType: splitType === "Equal" ? "Equal" : "Custom",
                participantIds: splitType === "Equal" ? selectedParticipantIds : [],
                splits: splitType !== "Equal"
                    ? previewSplits.map(s => ({ userId: s.userId, amountOwed: s.owed }))
                    : []
            };

            const created = await expenseService.CreateExpense(dto);
            toast.success("Expense added successfully!");
            onAdded(created);

            if (activeTab === 'group' && selectedGroupId) {
                navigate(`/expenses/group/${selectedGroupId}`);
            }
        } catch {
            // Error handled globally
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <h2><Receipt size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />Add Expense</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                {/* Internal Tab Switcher */}
                {!preselectedGroupId && (
                    <div className="expenses-tabs" style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('personal')}
                        >
                            <User size={16} /> Personal
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'group' ? 'active' : ''}`}
                            onClick={() => setActiveTab('group')}
                        >
                            <Users size={16} /> Group
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form">
                    {activeTab === 'group' && (
                        <div className="form-group">
                            <label>Select Group</label>
                            <select
                                className="input-field"
                                value={selectedGroupId}
                                onChange={e => setSelectedGroupId(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select a group...</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>

                            {/* Orange Warning if they change the group! */}
                            {preselectedGroupId && selectedGroupId && selectedGroupId !== preselectedGroupId && (
                                <div style={{ color: 'var(--color-warning)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                                    <AlertTriangle size={14} /> Warning: You are adding this expense to a different group than you were viewing.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'personal' && (
                        <div className="form-group">
                            <label>Split with Friend(s)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {friends.length === 0 ? <span className="text-muted" style={{ fontSize: '0.8rem' }}>You have no friends added yet.</span> : null}
                                {friends.map(f => (
                                    <div
                                        key={f.userId}
                                        onClick={() => toggleFriendSelection(f.userId)}
                                        style={{
                                            padding: '0.4rem 0.75rem', borderRadius: '2rem', cursor: 'pointer', fontSize: '0.85rem',
                                            background: selectedFriendIds.includes(f.userId) ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                            color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        {selectedFriendIds.includes(f.userId) && <Check size={12} />}
                                        {f.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Title</label>
                        <input type="text" className="input-field" placeholder="e.g. Dinner at Luigi's" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Amount (₹)</label>
                            <input type="number" step="0.01" className="input-field" placeholder="0.00" value={amount} onChange={e => setAmount(Number(e.target.value) || "")} required />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Category</label>
                            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="Sightseeing">Sightseeing</option>
                                <option value="Food">Food</option>
                                <option value="Transport">Transport</option>
                                <option value="Accommodation">Accommodation</option>
                                <option value="Activity">Activity</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Nature">Nature</option>
                                <option value="Culture">Culture</option>
                                <option value="Rest">Rest</option>
                                <option value="NightLife">NightLife</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>

                    {activeMembers.length > 1 && (
                        <>
                            <div className="form-group">
                                <label>Split By</label>
                                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '0.75rem' }}>
                                    {["Equal", "Exact", "Percentage"].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setSplitType(type as any)}
                                            style={{
                                                flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600,
                                                background: splitType === type ? 'var(--color-primary)' : 'transparent',
                                                color: splitType === type ? 'white' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Participants & Preview</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem' }}>
                                    {activeMembers.map(member => {
                                        const isSelected = selectedParticipantIds.includes(member.userId);
                                        const previewData = previewSplits.find(p => p.userId === member.userId);

                                        return (
                                            <div key={member.userId} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                                                {/* Checkbox for Equal Split inclusion */}
                                                {splitType === "Equal" && (
                                                    <div
                                                        onClick={() => toggleParticipant(member.userId)}
                                                        style={{
                                                            width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer',
                                                            background: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                    >
                                                        {isSelected && <Check size={14} color="white" />}
                                                    </div>
                                                )}

                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {member.imageUrl ? (
                                                        <img src={member.imageUrl} alt={member.userName} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                                    ) : (
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                                                            {member.userName.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                        {member.userName}
                                                    </span>
                                                </div>

                                                {/* Dynamic Input based on Split Type */}
                                                {splitType === "Exact" && (
                                                    <input
                                                        type="number" step="0.01" className="input-field" placeholder="₹0.00"
                                                        style={{ width: '90px', padding: '0.25rem 0.5rem', minHeight: '30px' }}
                                                        value={exactAmounts[member.userId] || ""}
                                                        onChange={e => {
                                                            setExactAmounts(prev => ({ ...prev, [member.userId]: e.target.value }));
                                                            if (!isSelected && e.target.value) toggleParticipant(member.userId);
                                                        }}
                                                    />
                                                )}

                                                {splitType === "Percentage" && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <input
                                                            type="number" step="1" className="input-field" placeholder="0"
                                                            style={{ width: '70px', padding: '0.25rem 0.5rem', minHeight: '30px' }}
                                                            value={percentages[member.userId] || ""}
                                                            onChange={e => {
                                                                setPercentages(prev => ({ ...prev, [member.userId]: e.target.value }));
                                                                if (!isSelected && e.target.value) toggleParticipant(member.userId);
                                                            }}
                                                        />
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>%</span>
                                                    </div>
                                                )}

                                                {/* Preview Amount Output */}
                                                <div style={{ width: '70px', textAlign: 'right', fontWeight: 600, color: isSelected && previewData?.owed ? 'var(--color-success)' : 'var(--text-muted)' }}>
                                                    ₹{previewData?.owed?.toFixed(2) || "0.00"}
                                                </div>

                                            </div>
                                        )
                                    })}

                                    {/* Warning text if exact/percentage doesn't add up */}
                                    {!isTotalValid && (
                                        <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', textAlign: 'right', marginTop: '0.5rem' }}>
                                            {totalComputed > numericAmount ? "Over" : "Short"} by ₹{Math.abs(numericAmount - totalComputed).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn-primary" disabled={submitting || (activeTab === 'group' && !selectedGroupId) || (activeTab === 'personal' && selectedFriendIds.length === 0) || (splitType !== "Equal" && !isTotalValid)}>
                        {submitting ? <><Loader2 size={18} className="spin" style={{ marginRight: '8px' }} /> Saving...</> : `Save Expense (₹${numericAmount.toFixed(2)})`}
                    </button>
                </form>
            </div>
        </div>
    );
}
