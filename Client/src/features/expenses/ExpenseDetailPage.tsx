import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import expenseService from '../../services/expenseService';
import type { ExpenseDto } from '../../types';
import { ChevronLeft, Calendar, Tag, AlertTriangle, Users, FileText, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import './expenseDetail.css';
import { getOptimizedImageUrl } from '../../utils/image';

export default function ExpenseDetailPage() {
    const { expenseId } = useParams<{ expenseId: string }>();
    const navigate = useNavigate();

    const [expense, setExpense] = useState<ExpenseDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!expenseId) return;
        expenseService.GetExpenseById(expenseId)
            .then(setExpense)
            .catch(() => toast.error('Failed to load expense details'))
            .finally(() => setLoading(false));
    }, [expenseId]);

    const handleMarkPaid = async (splitId: string) => {
        try {
            await expenseService.MarkSplitAsPaid(splitId);
            toast.success("Split marked as paid!");
            const updated = await expenseService.GetExpenseById(expenseId!);
            setExpense(updated);
        } catch (err: any) {
            // Error is already toasted by the api.ts unwrap function!
        }
    };

    if (loading) return <div className="expense-loading">Loading...</div>;
    if (!expense) return <div className="expense-not-found">Expense not found.</div>;

    return (
        <div className="expense-detail-container">
            {/* Header */}
            <div className="expense-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="expense-title">Expense Details</h1>
            </div>

            {/* Warning Alert */}
            {expense.warning && (
                <div className="warning-alert">
                    <AlertTriangle size={20} className="warning-icon" />
                    <span>{expense.warning}</span>
                </div>
            )}

            {/* Main Grid */}
            <div className="expense-grid">

                {/* ── Left Column: Expense Info ── */}
                <div className="glass-card expense-info-card">
                    <div>
                        <h2 className="expense-main-title">{expense.title}</h2>
                        <div className="expense-amount">
                            ₹{expense.amount.toFixed(2)}
                        </div>
                    </div>

                    <div className="expense-details-list">
                        {expense.description && (
                            <div className="expense-detail-item align-start">
                                <FileText className="icon" />
                                <span className="expense-detail-text">{expense.description}</span>
                            </div>
                        )}

                        <div className="expense-detail-item align-center">
                            <Tag className="icon" />
                            <span className="expense-detail-label">{expense.category || 'General'}</span>
                        </div>

                        <div className="expense-detail-item align-start">
                            <Calendar className="icon" />
                            <div className="expense-date-group">
                                <span className="expense-detail-label">{new Date(expense.date).toLocaleDateString()}</span>
                                <span className="expense-date-added">
                                    Added: {new Date(expense.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Paid By Link */}
                        <div className="expense-meta-row">
                            <span className="expense-meta-label">Paid by</span>
                            <Link to={`/profile/${expense.paidByUserId}`} className="user-pill">
                                {expense.paidByImageUrl ? (
                                    <img src={getOptimizedImageUrl(expense.paidByImageUrl, 100, 100)} alt={expense.paidByUser} loading="lazy" className="user-pill-img" />
                                ) : (
                                    <div className="user-pill-fallback">
                                        {expense.paidByUser[0]}
                                    </div>
                                )}
                                <span className="user-pill-name">{expense.paidByUser}</span>
                            </Link>
                        </div>

                        {/* Group Link */}
                        {expense.groupId && (
                            <div className="expense-meta-row" style={{ paddingTop: '0.5rem', borderTop: 'none' }}>
                                <Users size={18} style={{ color: 'var(--text-secondary)' }} />
                                <span className="expense-meta-label">Group</span>
                                <Link to={`/groups/${expense.groupId}`} className="group-pill">
                                    View Group
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Column: Splits Breakdown ── */}
                <div className="glass-card expense-splits-card">
                    <h3 className="splits-header">
                        <Users size={20} className="icon" /> Split Breakdown
                    </h3>

                    <div className="splits-list">
                        {expense.splits.map(split => (
                            <div key={split.id} className="split-card">
                                <Link to={`/profile/${split.userId}`} className="split-user-info">
                                    {split.userImageUrl ? (
                                        <img src={getOptimizedImageUrl(split.userImageUrl, 100, 100)} alt={split.name} loading="lazy" className="split-user-img" />
                                    ) : (
                                        <div className="split-user-fallback">
                                            {split.name[0]}
                                        </div>
                                    )}
                                    <div className="split-user-details">
                                        <span className="split-user-name">{split.name}</span>
                                        <span className={`split-status ${split.isPaid ? 'settled' : 'pending'}`}>
                                            {split.isPaid ? (
                                                <><CheckCircle2 size={12} /> <span className="split-status-text">Settled {split.paidAt ? new Date(split.paidAt).toLocaleDateString() : ''}</span></>
                                            ) : (
                                                <><Clock size={12} /> Pending</>
                                            )}
                                        </span>
                                    </div>
                                </Link>
                                <div className="split-action-row">
                                    <div className="split-amount">
                                        ₹{split.amountOwed.toFixed(2)}
                                    </div>
                                    {!split.isPaid && (
                                        <button onClick={() => handleMarkPaid(split.id)} className="btn-settle">
                                            <CheckCircle2 size={14} /> Settle
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
