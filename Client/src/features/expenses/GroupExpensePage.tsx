import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import expenseService from '../../services/expenseService';
import type { GroupAnalyticsDto, ExpenseDto } from '../../types';
import { ArrowRight, CheckCircle2, ChevronLeft, Receipt, TrendingDown, TrendingUp, PieChart, BarChart3, List, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import './groupExpense.css';
import AddExpenseModal from '../../components/modals/AddExpenseModal';
import { getOptimizedImageUrl } from '../../utils/image';

export default function GroupExpensePage() {
    const { groupId } = useParams<{ groupId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState<GroupAnalyticsDto | null>(null);
    const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadData = (isMounted: boolean = true) => {
        if (!groupId) return;
        setLoading(true);
        Promise.all([
            expenseService.GetGroupAnalytics(groupId),
            expenseService.GetGroupExpenses(groupId)
        ])
            .then(([a, e]) => {
                if (isMounted) {
                    setAnalytics(a);
                    setExpenses(e);
                }
            })
            .catch(() => {
                if (isMounted) toast.error('Failed to load group analytics');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
    };

    useEffect(() => {
        let isMounted = true;
        loadData(isMounted);
        return () => { isMounted = false; };
    }, [groupId]);

    const handleMarkPaid = async (splitId: string) => {
        try {
            // Optimistic Update
            setExpenses(prev => prev.map(exp => ({
                ...exp,
                splits: exp.splits.map(s => s.id === splitId ? { ...s, isPaid: true } : s)
            })));

            await expenseService.MarkSplitAsPaid(splitId);
            toast.success("Split marked as settled!");
        } catch {
            // Revert on failure
            loadData();
        }
    };

    const unsettledExpenses = useMemo(() => expenses.filter(e => !e.splits.every(s => s.isPaid)), [expenses]);

    if (loading) return <div className="group-expense-loading"><div className="spin"><Receipt size={32} /></div></div>;
    if (!analytics) return <div className="group-expense-loading">Failed to load data.</div>;

    // Calculate percentage for donut chart
    const totalGroupSpend = analytics.totalGroupSpend || 0;
    const settledPct = totalGroupSpend > 0 ? (analytics.totalSettled / totalGroupSpend) * 100 : 0;

    // CSS Conic Gradient string for the Donut
    const donutGradient = `conic-gradient(var(--color-success) 0% ${settledPct}%, var(--color-danger) ${settledPct}% 100%)`;
    const currentUserContribution = analytics.memberContributions.find(m => m.userId === user?.userId);
    const myBalance = currentUserContribution?.netBalance || 0;
    const iAmOwed = myBalance > 0;
    const iOwe = myBalance < 0;
    return (
        <div className="group-expense-page">
            <div className="g-header">
                <button className="g-back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1>Group Finances</h1>
            </div>

            {/* ── CURRENT USER SUMMARY ── */}
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: iAmOwed ? 'rgba(40, 167, 69, 0.1)' : iOwe ? 'rgba(220, 53, 69, 0.1)' : 'rgba(255,255,255,0.05)' }}>
                {iAmOwed ? (
                    <TrendingUp size={36} className="text-green" />
                ) : iOwe ? (
                    <TrendingDown size={36} className="text-red" />
                ) : (
                    <CheckCircle2 size={36} className="text-muted" />
                )}

                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>My Balance</h3>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }} className={iAmOwed ? 'text-green' : iOwe ? 'text-red' : 'text-muted'}>
                        {iAmOwed
                            ? `You are owed ₹${Math.abs(myBalance).toFixed(2)}`
                            : iOwe
                                ? `You owe ₹${Math.abs(myBalance).toFixed(2)}`
                                : "You are completely settled up!"}
                    </p>
                    {(iAmOwed || iOwe) && (
                        <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                            Total Paid: ₹{(currentUserContribution?.totalPaid || 0).toFixed(0)} • Total Share: ₹{(currentUserContribution?.totalOwed || 0).toFixed(0)}
                        </p>
                    )}
                </div>
            </div>


            <div className="g-dashboard-grid">

                {/* ── LEFT COLUMN ── */}
                <div className="g-col">

                    {/* Donut Chart: Settled vs Unsettled */}
                    <div className="glass-card g-section">
                        <h3><PieChart size={20} /> Total Spend</h3>
                        <div className="donut-container">
                            <div className="donut-chart" style={{ background: donutGradient }}>
                                <div className="donut-inner">
                                    <span className="donut-inner-label">Total ({analytics.totalExpenses || 0} items)</span>
                                    <span className="donut-inner-value">₹{totalGroupSpend.toFixed(0)}</span>
                                </div>
                            </div>
                            <div className="donut-legend">
                                <div className="legend-item">
                                    <span className="legend-label"><div className="legend-dot" style={{ background: 'var(--color-success)' }}></div> Settled</span>
                                    <span className="legend-val">₹{analytics.totalSettled.toFixed(2)}</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-label"><div className="legend-dot" style={{ background: 'var(--color-danger)' }}></div> Unsettled</span>
                                    <span className="legend-val">₹{analytics.totalUnsettled.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Who Owes Whom (Directional Arrows) */}
                    <div className="glass-card g-section">
                        <h3><Users size={20} /> Who Owes Whom</h3>
                        {analytics.balances.length === 0 ? (
                            <p className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>Everyone is fully settled up! 🎉</p>
                        ) : (
                            <div className="balances-list">
                                {analytics.balances.map((b, i) => (
                                    <div key={i} className="balance-row">
                                        <div className="b-user">
                                            {b.fromUserImageUrl ? <img src={getOptimizedImageUrl(b.fromUserImageUrl, 100, 100)} alt={b.fromUserName} loading="lazy" /> : <div className="b-avatar">{b.fromUserName[0]}</div>}
                                            <span>{b.fromUserId === user?.userId ? "You" : b.fromUserName}</span>
                                        </div>
                                        <div className="b-arrow">
                                            <span className="b-amount">₹{b.amount.toFixed(2)}</span>
                                            <ArrowRight size={20} className="arrow-icon" />
                                        </div>
                                        <div className="b-user">
                                            {b.toUserImageUrl ? <img src={getOptimizedImageUrl(b.toUserImageUrl, 100, 100)} alt={b.toUserName} loading="lazy" /> : <div className="b-avatar">{b.toUserName[0]}</div>}
                                            <span>{b.toUserId === user?.userId ? "You" : b.toUserName}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Category Breakdown (Horizontal Bars) */}
                    <div className="glass-card g-section">
                        <h3><BarChart3 size={20} /> Category Breakdown</h3>
                        {analytics.categoryBreakdown.map(c => (
                            <div key={c.category} className="cat-row">
                                <div className="cat-labels">
                                    <span>{c.category} <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '4px' }}>({c.expenseCount} items)</span></span>
                                    <span>₹{c.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="cat-bar-bg">
                                    <div className="cat-bar-fill" style={{ width: `${totalGroupSpend > 0 ? ((c.totalAmount || 0) / totalGroupSpend) * 100 : 0}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="g-col">

                    {/* Net Balances per Person */}
                    <div className="glass-card g-section">
                        <h3><TrendingUp size={20} /> Member Balances</h3>
                        <div className="net-balances-list">
                            {analytics.memberContributions.map(m => {
                                const isOwed = m.netBalance > 0;
                                const owes = m.netBalance < 0;
                                return (
                                    <div key={m.userId} className="net-row">
                                        <div className="net-user">
                                            {m.imageUrl ? <img src={getOptimizedImageUrl(m.imageUrl, 100, 100)} alt={m.userName} loading="lazy" /> : <div className="b-avatar">{m.userName?.[0] || '?'}</div>}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                                <span>{m.userId === user?.userId ? "You" : m.userName}</span>
                                                <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                                                    Paid: ₹{(m.totalPaid || 0).toFixed(0)} • Share: ₹{(m.totalOwed || 0).toFixed(0)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`net-amount ${isOwed ? 'text-green' : owes ? 'text-red' : 'text-muted'}`}>
                                            {isOwed ? <TrendingUp size={16} /> : owes ? <TrendingDown size={16} /> : null}
                                            ₹{Math.abs(m.netBalance).toFixed(2)} {isOwed ? "Owed" : owes ? "Owe" : "Settled"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Expense List w/ Mark as Paid logic */}
                    <div className="glass-card g-section">
                        <h3><List size={20} /> Unsettled Expenses</h3>
                        <div className="g-exp-list">
                            {unsettledExpenses.length === 0 && (
                                <p className="text-muted" style={{ textAlign: 'center' }}>No pending expenses.</p>
                            )}

                            {unsettledExpenses.map(exp => {
                                // Find if the current user owes money on this expense
                                const mySplit = exp.splits.find(s => s.userId === user?.userId);
                                const iOwe = mySplit && !mySplit.isPaid && exp.paidByUserId !== user?.userId;

                                return (
                                    <div key={exp.id} className="g-exp-card">
                                        <div className="g-exp-info">
                                            <strong>{exp.title}</strong>
                                            <span className="text-muted">
                                                Paid by {exp.paidByUserId === user?.userId ? 'You' : exp.paidByUser}
                                            </span>
                                        </div>
                                        <div className="g-exp-right">
                                            <strong>₹{exp.amount.toFixed(2)}</strong>

                                            {/* Show Pay button if the current user owes money on this split */}
                                            {iOwe ? (
                                                <button className="btn-mark-paid" onClick={() => handleMarkPaid(mySplit.id)}>
                                                    <CheckCircle2 size={14} /> Pay ₹{mySplit.amountOwed.toFixed(2)}
                                                </button>
                                            ) : (
                                                <div className="avatar-stack" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                                                    {exp.splits
                                                        .map((split, idx) => {
                                                            const statusClass = split.isPaid ? 'split-paid' : 'split-pending';
                                                            return split.userImageUrl ? (
                                                                <img
                                                                    key={split.userId}
                                                                    src={getOptimizedImageUrl(split.userImageUrl, 80, 80)}
                                                                    alt={split.name}
                                                                    loading="lazy"
                                                                    className={`avatar-stack-item ${statusClass}`}
                                                                    style={{ zIndex: 5 - idx }}
                                                                    title={`${split.userId === user?.userId ? "You" : split.name} - ${split.isPaid ? 'Paid' : 'Pending'}`}
                                                                />
                                                            ) : (
                                                                <div
                                                                    key={split.userId}
                                                                    className={`avatar-stack-item fallback ${statusClass}`}
                                                                    style={{ zIndex: 5 - idx }}
                                                                    title={`${split.userId === user?.userId ? "You" : split.name} - ${split.isPaid ? 'Paid' : 'Pending'}`}
                                                                >
                                                                    {split.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                </div>

                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* Floating Action Button */}
            <button className="expense-fab" onClick={() => setShowAddModal(true)}>
                <Plus size={24} />
            </button>
            {showAddModal && (
                <AddExpenseModal
                    preselectedGroupId={groupId}
                    onClose={() => setShowAddModal(false)}
                    onAdded={(newExp) => {
                        setExpenses(prev => [newExp, ...prev]);
                        setShowAddModal(false);
                        loadData(); // To refresh analytics
                    }}
                />
            )}
        </div>
    );
}
