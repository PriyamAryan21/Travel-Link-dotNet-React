import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import expenseService from '../../services/expenseService';
import type { UserToUserDto } from '../../types';
import { ChevronLeft, Receipt, TrendingDown, TrendingUp, Users, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import './groupExpense.css';

export default function UserExpensePage() {
    const { userId } = useParams<{ userId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [summary, setSummary] = useState<UserToUserDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalExpenseId, setDeleteModalExpenseId] = useState<string | null>(null);

    const loadData = () => {
        if (!userId) return;
        setLoading(true);
        expenseService.GetUserToUserSummary(userId)
            .then(setSummary)
            .catch(() => toast.error('Failed to load user expenses'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    const handleMarkPaid = async (expenseId: string) => {
        try {
            // We need to fetch the full expense to get our splitId
            const expense = await expenseService.GetExpenseById(expenseId);
            const mySplit = expense.splits?.find(s => s.userId === user?.userId);
            if (!mySplit) throw new Error("Could not find your split for this expense.");

            await expenseService.MarkSplitAsPaid(mySplit.id);
            toast.success("Marked as paid!");
            loadData();
        } catch (err: any) {
        }
    };

    const handleDeleteClick = (expenseId: string) => {
        setDeleteModalExpenseId(expenseId);
    };

    const confirmDelete = async () => {
        if (!deleteModalExpenseId) return;
        try {
            await expenseService.DeleteExpenseAsync(deleteModalExpenseId);
            toast.success("Expense deleted");
            loadData();
        } catch {
            // error handled by interceptor
        } finally {
            setDeleteModalExpenseId(null);
        }
    };

    if (loading) return <div className="group-expense-loading"><div className="spin"><Receipt size={32} /></div></div>;
    if (!summary) return <div className="group-expense-loading">Failed to load data.</div>;

    const netBal = summary.netBalance || 0;
    const isOwed = netBal > 0;
    const owes = netBal < 0;

    return (
        <div className="group-expense-page" style={{ paddingBottom: '3rem' }}>
            <div className="g-header">
                <button className="g-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ margin: 0 }}>{summary.name}</h1>
            </div>

            {/* ── Removed the narrow 850px max-width, allowing it to stretch gracefully ── */}
            <div className="g-dashboard-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '1200px', margin: '0 auto', paddingTop: '3rem' }}>

                {/* ── Facebook-Style Profile & Net Balance Card ── */}
                <div className="glass-card g-section" style={{ textAlign: 'center', padding: '4rem 2rem 2rem', position: 'relative' }}>

                    {/* Massive Overlapping Profile Picture */}
                    <div style={{
                        position: 'absolute',
                        top: '-55px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        border: '5px solid var(--color-surface)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        zIndex: 10
                    }}>
                        {summary.imageUrl ? (
                            <img src={summary.imageUrl} alt={summary.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            summary.name?.[0]?.toUpperCase() || '?'
                        )}
                    </div>

                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Net Balance</h3>

                    <div className={`net-amount ${isOwed ? 'text-green' : owes ? 'text-red' : 'text-muted'}`} style={{ fontSize: '3rem', justifyContent: 'center' }}>
                        {isOwed ? <TrendingUp size={42} /> : owes ? <TrendingDown size={42} /> : null}
                        ₹{Math.abs(netBal).toFixed(2)}
                    </div>

                    <p style={{ marginTop: '0.75rem', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {isOwed ? `${summary.name} owes you` : owes ? `You owe ${summary.name}` : "You are fully settled up!"}
                    </p>

                    {(summary.totalYouOwe || 0) > 0 && (
                        <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: 'var(--color-danger)' }}>
                            Total you owe across unsettled expenses: ₹{(summary.totalYouOwe || 0).toFixed(2)}
                        </div>
                    )}

                    {summary.commonGroups && summary.commonGroups.length > 0 && (
                        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <Users size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                            Common Groups: {summary.commonGroups.join(', ')}
                        </div>
                    )}
                </div>

                {/* ── Ultra-Wide Transactions List ── */}
                <div className="glass-card g-section" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}><Receipt size={22} /> Transaction History</h3>

                    {(!summary.transactions || summary.transactions.length === 0) ? (
                        <p className="text-muted" style={{ textAlign: 'center', padding: '3rem 0' }}>No transaction history with {summary.name}.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {summary.transactions.map((t, i) => (

                                /* Slim & Wide Transaction Card */
                                <div key={t.expenseId + i.toString()} className="glass-card" style={{
                                    opacity: t.isSettled ? 0.65 : 1,
                                    padding: '1rem 1.5rem',
                                    background: 'var(--glass-bg)',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1.5rem',
                                    transition: 'transform 0.2s',
                                }}>

                                    {/* 1. Details (Title, Date, Category) */}
                                    <div style={{ flex: '1 1 250px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{t.title}</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <span>{new Date(t.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{t.category}</span>
                                            {t.groupName && (
                                                <>
                                                    <span>•</span>
                                                    <span style={{ color: 'var(--color-primary)' }}>{t.groupName}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Bill Payer Info */}
                                    <div style={{ flex: '1 1 200px' }}>
                                        <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                                            {t.youPaid ? 'You paid the bill' : `${summary.name} paid the bill`}
                                            <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                                                Total: ₹{(t.amount || 0).toFixed(2)}
                                            </strong>
                                        </span>
                                    </div>

                                    {/* 3. Your Share Impact */}
                                    <div style={{ flex: '1 1 120px', textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Your Share</div>
                                        <div style={{
                                            fontSize: '1.35rem',
                                            fontWeight: 'bold',
                                            color: t.isSettled ? 'var(--text-muted)' : (t.youPaid ? 'var(--color-success)' : 'var(--color-danger)')
                                        }}>
                                            {t.youPaid ? '+' : '-'} ₹{(t.yourShare || 0).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* 4. Action Buttons */}
                                    <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'flex-end', minWidth: '130px' }}>
                                        {!t.isSettled && !t.youPaid && (
                                            <button className="btn-mark-paid" style={{ padding: '0.6rem 1.2rem', display: 'flex', gap: '0.5rem', fontWeight: 'bold' }} onClick={() => handleMarkPaid(t.expenseId)}>
                                                <CheckCircle2 size={16} /> Pay
                                            </button>
                                        )}
                                        {t.isSettled && (
                                            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0' }}>
                                                <CheckCircle2 size={18} /> Settled
                                            </span>
                                        )}
                                        {t.youPaid && (
                                            <button className="btn-mark-paid" style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-danger)', padding: '0.6rem 1rem' }} onClick={() => handleDeleteClick(t.expenseId)}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        )}
                                    </div>

                                </div>

                            ))}
                        </div>
                    )}
                </div>

            </div>

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