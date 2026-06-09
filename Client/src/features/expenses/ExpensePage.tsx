import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import expenseService from '../../services/expenseService';
import type { ExpenseDto } from '../../types';
import {
    Plus, Receipt, Users, User, Trash2,
    CheckCircle2, CircleDashed, Utensils,
    Car, Home, ShoppingBag, Plane,
    Minus, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import './expenses.css';
import AddExpenseModal from '../../components/modals/AddExpenseModal';
import { getOptimizedImageUrl } from '../../utils/image';

export default function ExpensesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showAddModal, setShowAddModal] = useState(false);
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
    const [deleteModalExpenseId, setDeleteModalExpenseId] = useState<string | null>(null);

    useEffect(() => {
        expenseService.GetUserExpenses()
            .then(setExpenses)
            .catch(() => toast.error('Failed to load expenses'))
            .finally(() => setLoading(false));
    }, []);

    // Filter expenses into tabs
    const personalExpenses = expenses.filter(e => !e.groupId);
    const groupExpenses = expenses.filter(e => e.groupId);
    const displayedExpenses = activeTab === 'personal' ? personalExpenses : groupExpenses;

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteModalExpenseId(id);
    };

    const confirmDelete = async () => {
        if (!deleteModalExpenseId) return;
        try {
            await expenseService.DeleteExpenseAsync(deleteModalExpenseId);
            setExpenses(prev => prev.filter(exp => exp.id !== deleteModalExpenseId));
            toast.success('Expense deleted');
        } catch {
            // error is already handled by your unwrap utility
        } finally {
            setDeleteModalExpenseId(null);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Helper to get category icons
    const getCategoryIcon = (category?: string) => {
        switch (category?.toLowerCase()) {
            case 'food': return <Utensils size={20} />;
            case 'transport': return <Car size={20} />;
            case 'accommodation': return <Home size={20} />;
            case 'shopping': return <ShoppingBag size={20} />;
            case 'flights': return <Plane size={20} />;
            default: return <Receipt size={20} />;
        }
    };

    // Helper to determine split status
    const getSplitStatus = (expense: ExpenseDto) => {
        // 1. If everyone has paid, it's completely settled
        const isSettled = expense.splits.every(s => s.isPaid);
        if (isSettled) {
            return { text: 'Settled', className: 'status-settled', icon: <CheckCircle2 size={14} /> };
        }

        // 2. If the current user paid the overall bill, they are waiting for others
        if (expense.paidByUserId === user?.userId) {
            return { text: 'Awaiting Payments', className: 'status-pending', icon: <CircleDashed size={14} /> };
        }

        // 3. Check if the current user is the one who still owes money
        const mySplit = expense.splits.find(s => s.userId === user?.userId);
        if (mySplit && !mySplit.isPaid) {
            return { text: 'You Owe', className: 'status-pending', icon: <CircleDashed size={14} /> };
        }

        // 4. Default fallback if they are just an observer or already paid their part
        return { text: 'Pending', className: 'status-pending', icon: <CircleDashed size={14} /> };
    };


    const getSettlementInfo = (expense: ExpenseDto) => {
        if (!user?.userId) return null;
        const isPayer = expense.paidByUserId === user.userId;
        if (isPayer) {
            // You paid. Calculate how much others still owe you.
            const amountStillOwedToYou = expense.splits
                .filter(s => s.userId !== user.userId && !s.isPaid)
                .reduce((sum, s) => sum + s.amountOwed, 0);
            if (amountStillOwedToYou > 0) {
                return {
                    amount: `₹${amountStillOwedToYou.toFixed(2)}`,
                    className: 'settlement-owed', // Green
                    icon: <Plus size={14} />
                };
            }
        } else {
            // Someone else paid. Check if you owe them.
            const yourSplit = expense.splits.find(s => s.userId === user.userId);
            if (yourSplit && !yourSplit.isPaid) {
                return {
                    amount: `₹${yourSplit.amountOwed.toFixed(2)}`,
                    className: 'settlement-owe', // Red
                    icon: <Minus size={14} />
                };
            }
        }
        return null; // Fully settled or you aren't involved
    };


    return (
        <div className="expenses-page">
            {/* Header */}
            <div className="expenses-header">
                <h1 className="expenses-title">Expenses</h1>

                {/* Tabs */}
                <div className="expenses-tabs glass-card">
                    <button
                        className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('personal')}
                    >
                        <User size={16} /> Personal
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'group' ? 'active' : ''}`}
                        onClick={() => setActiveTab('group')}
                    >
                        <Users size={16} /> Group
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="expenses-list">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="glass-card expense-card skeleton" style={{ height: '100px' }} />
                    ))
                ) : displayedExpenses.length > 0 ? (
                    displayedExpenses.map(expense => {
                        const status = getSplitStatus(expense);
                        return (
                            <div
                                key={expense.id}
                                className="glass-card expense-card"
                                onClick={() => navigate(`/expenses/${expense.id}`)}
                            >
                                <div className="expense-card-left">
                                    <div className="expense-category-icon">
                                        {getCategoryIcon(expense.category)}
                                    </div>
                                    <div className="expense-details">
                                        <h3 className="expense-title">{expense.title}</h3>
                                        <span className="expense-date">{formatDate(expense.date)}</span>

                                        {/* NEW: Avatar Stack to show who is in the split */}
                                        <div className="expense-participants">
                                            {expense.splits.slice(0, 4).map((split, idx) => {
                                                // Dynamically assign class based on payment status
                                                const statusClass = split.isPaid ? 'split-paid' : 'split-pending';

                                                return split.userImageUrl ? (
                                                    <img
                                                        key={split.userId}
                                                        src={getOptimizedImageUrl(split.userImageUrl, 80, 80)}
                                                        alt={split.name}
                                                        loading="lazy"
                                                        className={`avatar-stack-item ${statusClass}`}
                                                        style={{ zIndex: 5 - idx }}
                                                        title={`${split.name} - ${split.isPaid ? 'Paid' : 'Pending'}`}
                                                    />
                                                ) : (
                                                    <div
                                                        key={split.userId}
                                                        className={`avatar-stack-item fallback ${statusClass}`}
                                                        style={{ zIndex: 5 - idx }}
                                                        title={`${split.name} - ${split.isPaid ? 'Paid' : 'Pending'}`}
                                                    >
                                                        {split.name.charAt(0).toUpperCase()}
                                                    </div>
                                                );
                                            })}
                                            {expense.splits.length > 4 && (
                                                <div className="avatar-stack-item more-count" style={{ zIndex: 0 }}>
                                                    +{expense.splits.length - 4}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`expense-status ${status.className}`}>
                                            {status.icon} {status.text}
                                        </div>
                                    </div>

                                </div>

                                <div className="expense-card-right">
                                    <span className="expense-amount">₹{expense.amount.toFixed(2)}</span>
                                    {(() => {
                                        const settlement = getSettlementInfo(expense);
                                        if (!settlement) return null;
                                        return (
                                            <span className={`expense-settlement ${settlement.className}`}>
                                                {settlement.icon} {settlement.amount}
                                            </span>
                                        );
                                    })()}

                                    <div className="expense-payer">
                                        <span className="payer-text">Paid by</span>
                                        {expense.paidByImageUrl ? (
                                            <img src={getOptimizedImageUrl(expense.paidByImageUrl, 80, 80)} alt={expense.paidByUser} loading="lazy" className="payer-avatar" />
                                        ) : (
                                            <div className="payer-avatar-fallback">
                                                {expense.paidByUser.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>



                                    {/* Only payer can delete */}
                                    {expense.paidByUserId === user?.userId && (
                                        <button
                                            className="expense-delete-btn"
                                            onClick={(e) => handleDeleteClick(e, expense.id)}
                                            title="Delete Expense"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="glass-card expenses-empty">
                        <Receipt size={48} className="empty-icon" />
                        <p>No {activeTab} expenses found</p>
                        <span className="empty-subtext">Click the + button to add a new expense</span>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button className="expense-fab" onClick={() => setShowAddModal(true)}>
                <Plus size={24} />
            </button>
            {showAddModal && (
                <AddExpenseModal
                    initialTab={activeTab} // <-- Add this single prop here!
                    onClose={() => setShowAddModal(false)}
                    onAdded={(newExp) => {
                        setExpenses(prev => [newExp, ...prev]);
                        setShowAddModal(false);
                    }}
                />
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteModalExpenseId && (
                <div className="modal-overlay" onClick={() => setDeleteModalExpenseId(null)}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: 'var(--color-danger)', marginBottom: '1rem' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>Delete Expense?</h2>
                        <p className="text-muted" style={{ marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Are you sure you want to delete this expense? This will remove the transaction for everyone involved.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => setDeleteModalExpenseId(null)} 
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--glass-bg)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--color-danger)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
