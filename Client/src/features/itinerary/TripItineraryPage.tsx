import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import itineraryService from '../../services/itineraryService';
import type { GroupItineraryStatusDto, SuggestionDto, AddSuggestionDto } from '../../types';
import {
    ArrowLeft, Calendar, Wallet, Trash2, CheckCircle, XCircle,
    ThumbsUp, Plus, Sparkles, Navigation, Loader2, MapPin, Lightbulb, X,
    Info, Wand2,
    AlertTriangle
} from 'lucide-react';
import './tripItinerary.css';

export default function TripItineraryPage() {
    const { tripId, itineraryId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [statusData, setStatusData] = useState<GroupItineraryStatusDto | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        actionType: 'generate' | 'autoGenerate' | 'deleteRequest' | 'deleteSuggestion' | null;
        targetId?: string;
    }>({
        isOpen: false, title: '', message: '', actionType: null
    });

    const infoRef = useRef<HTMLDivElement>(null);
    const infoTimeoutRef = useRef<number | null>(null);

    // Handle clicks outside of the info popover to dismiss it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
                setShowInfo(false);
                if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);
            }
        };

        if (showInfo) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showInfo]);

    const handleInfoClick = () => {
        const nextState = !showInfo;
        setShowInfo(nextState);

        if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);

        if (nextState) {
            infoTimeoutRef.current = setTimeout(() => {
                setShowInfo(false);
            }, 10000); // Dissolve after 10 seconds
        }
    };



    const loadDashboard = async () => {
        try {
            if (!tripId) return;
            const status = await itineraryService.getTripStatus(tripId);
            setStatusData(status);

            if (status?.requestId) {
                const suggs = await itineraryService.getSuggestions(status.requestId);
                setSuggestions(suggs);
            }
        } catch {
            // Error handled by API interceptor
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [tripId]);

    // --- Actions ---
    const handleDeleteRequestClick = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Itinerary Request?',
            message: 'Are you sure you want to delete this entire itinerary request? This cannot be undone.',
            actionType: 'deleteRequest'
        });
    };

    // 1. Triggers the Generate Confirmation
    const handleGenerateClick = () => {
        const generated = statusData?.status === "Generated";
        setConfirmConfig({
            isOpen: true,
            title: generated ? 'Regenerate Itinerary' : 'Generate Itinerary',
            message: generated
                ? 'This will overwrite your currently generated itinerary with a new one. Do you want to proceed?'
                : 'Voting will be closed once an itinerary is generated. Do you want to proceed?',
            actionType: 'generate'
        });
    };

    // 2. Triggers the Auto Generate Confirmation
    const handleAutoGenerateClick = () => {
        const generated = statusData?.status === "Generated";
        setConfirmConfig({
            isOpen: true,
            title: generated ? 'Auto Regenerate Itinerary' : 'Auto Generate Itinerary',
            message: generated
                ? 'The smart itinerary builder will overwrite your existing itinerary automatically without considering votes. Do you want to proceed?'
                : 'The smart itinerary builder will automatically generate the itinerary without considering the votes, approvals, and suggestions. Do you want to proceed?',
            actionType: 'autoGenerate'
        });
    };


    const handleConfirmAction = async () => {
        if (!statusData?.requestId || !confirmConfig.actionType) return;

        setConfirmConfig(prev => ({ ...prev, isOpen: false }));

        let hasError = false;

        const handleApiError = (e: any) => {
            hasError = true;
            loadDashboard();
        };

        if (confirmConfig.actionType === 'deleteRequest') {
            setActionLoading(true);
            try {
                await itineraryService.deleteRequest(statusData.requestId);
                toast.success("Itinerary deleted.");
                navigate(`/trips/${tripId}`);
            } catch {
            } finally {
                setActionLoading(false);
            }
            return;
        }

        if (confirmConfig.actionType === 'deleteSuggestion' && confirmConfig.targetId) {
            setActionLoading(true);
            const sid = confirmConfig.targetId;
            try {
                await itineraryService.deleteSuggestion(sid);
                toast.success("Suggestion deleted.");
                setSuggestions(prev => prev.filter(s => s.id !== sid));
                if (statusData) {
                    setStatusData(prev => prev ? { ...prev, totalSuggestions: prev.totalSuggestions - 1 } : prev);
                }
            } catch {
            } finally {
                setActionLoading(false);
            }
            return;
        }

        if (confirmConfig.actionType === 'generate') {
            itineraryService.generate(statusData.requestId, { note: null }).catch(handleApiError);
        } else if (confirmConfig.actionType === 'autoGenerate') {
            itineraryService.generate(statusData.requestId, { note: "AUTO_GENERATE" }).catch(handleApiError);
        }

        setTimeout(() => {
            if (!hasError) {
                toast.success("Itinerary generation started! You can roam around while we build it.", { duration: 5000 });
                setStatusData(prev => prev ? { ...prev, status: 'Generating' } : prev);
            }
        }, 300);
    };





    const handleVote = async (suggestionId: string) => {
        // Optimistic UI
        setSuggestions(prev => prev.map(s => {
            if (s.id === suggestionId) {
                const isVoting = !s.hasCurrentUserVoted;
                return { ...s, hasCurrentUserVoted: isVoting, voteCount: s.voteCount + (isVoting ? 1 : -1) };
            }
            return s;
        }));

        try {
            await itineraryService.toggleVote(suggestionId);
        } catch {
            loadDashboard(); // Revert on failure
        }
    };

    const handleAdminReview = async (suggestionId: string, approved: boolean) => {
        try {
            await itineraryService.reviewSuggestion(suggestionId, { adminApproved: approved });
            toast.success(approved ? "Suggestion approved" : "Suggestion rejected");
            loadDashboard();
        } catch {
            // Handled
        }
    };

    const handleDeleteSuggestionClick = (suggestionId: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Suggestion?',
            message: 'Are you sure you want to delete this suggestion? This cannot be undone.',
            actionType: 'deleteSuggestion',
            targetId: suggestionId
        });
    };

    const handleAddSuggestion = async (dto: AddSuggestionDto) => {
        if (!statusData?.requestId) return;
        try {
            const newSugg = await itineraryService.addSuggestion(statusData.requestId, dto);
            setSuggestions(prev => [newSugg, ...prev]);
            setStatusData(prev => prev ? { ...prev, totalSuggestions: prev.totalSuggestions + 1 } : prev);
            setShowAddModal(false);
            toast.success("Suggestion added!");
        } catch {
            // Handled
        }
    };

    // --- Renders ---
    if (loading) {
        return (
            <div className="itin-page">
                <div className="flex-center" style={{ height: '60vh' }}>
                    <div className="spin"><Loader2 size={32} /></div>
                </div>
            </div>
        );
    }

    if (!statusData) {
        return (
            <div className="itin-page">
                <div className="itin-header">
                    <button className="itin-back-btn" onClick={() => navigate(`/trips/${tripId}`)}>
                        <ArrowLeft size={18} />
                    </button>
                    <h1>Itinerary</h1>
                </div>
                <div className="glass-card itin-empty">
                    <Navigation size={48} className="text-muted" />
                    <h2>No Itinerary Found</h2>
                    <p className="text-muted">There is no active itinerary request for this trip.</p>
                </div>
            </div>
        );
    }

    const isAdmin = statusData.isAdmin;
    const isGenerated = statusData.status === "Generated";
    const isOpen = statusData.status === "Open";
    const isGenerating = statusData.status === "Generating";
    const progressPct = statusData.totalSuggestions > 0
        ? (statusData.approvedSuggestions / statusData.totalSuggestions) * 100 : 0;
    console.log("Admin: ", isAdmin);
    const totalDays = Math.max(1,
        Math.ceil((new Date(statusData.endDate).getTime() - new Date(statusData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    return (
        <div className="itin-page">
            {/* ── Header ── */}
            <div className="itin-header">
                <button className="itin-back-btn" onClick={() => navigate(`/trips/${tripId}`)}>
                    <ArrowLeft size={18} />
                </button>
                <h1 className='section-header'>Itinerary</h1>
            </div>

            {/* ════════════════════════════════════════
                TOP HALF: Status Dashboard
               ════════════════════════════════════════ */}
            <div className="glass-card itin-dashboard">
                <div className="itin-dashboard-top">
                    <h2 className="itin-destination">
                        <MapPin size={22} className="text-primary" />
                        {statusData.destination}
                    </h2>
                    <span className={`status-badge ${statusData.status.toLowerCase()}`}>
                        {isOpen ? "Collecting Suggestions" : isGenerating ? "Generating..." : statusData.status}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="dashboard-stats-grid">
                    <div className="stat-box">
                        <Calendar size={18} className="text-primary" />
                        <div>
                            <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Date Range</p>
                            <strong>
                                {new Date(statusData.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                {' — '}
                                {new Date(statusData.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </strong>
                            <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '0.4rem' }}>
                                ({totalDays} day{totalDays > 1 ? 's' : ''})
                            </span>
                        </div>
                    </div>
                    <div className="stat-box">
                        <Wallet size={18} className="text-success" />
                        <div>
                            <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Total Budget</p>
                            <strong>₹{statusData.totalBudget.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                {/* Suggestion Progress */}
                <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Lightbulb size={14} className="text-warning" />Suggestions
                        </span>
                        <strong>{statusData.approvedSuggestions} / {statusData.totalSuggestions} Approved</strong>
                    </div>
                    <div className="progress-bg">
                        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="itin-actions">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>

                        {/* ── TOP ROW: Generate, Auto Generate, Info ── */}
                        {/* ── TOP ROW: Generate, Auto Generate, Info ── */}
                        <div className="itin-actions-top-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                            {isAdmin && (isOpen || isGenerating || isGenerated) && (
                                <button
                                    className="btn btn-generate"
                                    onClick={handleGenerateClick}
                                    disabled={actionLoading || isGenerating}
                                    style={{ flex: 1, minWidth: '140px' }}
                                >
                                    {(actionLoading || isGenerating)
                                        ? <><div className="spin" style={{ display: 'inline-flex' }}><Loader2 size={18} /></div> Generating...</>
                                        : <><Sparkles size={18} /> {isGenerated ? "Regenerate" : "Generate Itinerary"}</>
                                    }
                                </button>
                            )}

                            {isAdmin && (isOpen || isGenerating || isGenerated) && (
                                <button
                                    className="btn btn-auto-generate"
                                    onClick={handleAutoGenerateClick}
                                    disabled={actionLoading || isGenerating}
                                    style={{ flex: 1, minWidth: '140px' }}
                                >
                                    {(actionLoading || isGenerating)
                                        ? <><div className="spin" style={{ display: 'inline-flex' }}><Loader2 size={18} /></div> Generating...</>
                                        : <><Wand2 size={18} /> {isGenerated ? "Auto Regenerate" : "Auto Generate"}</>
                                    }
                                </button>
                            )}

                            {isAdmin && (
                                <div
                                    className={`info-container ${showInfo ? 'active' : ''}`}
                                    ref={infoRef}
                                    style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                                >
                                    <div className="info-icon-wrapper" onClick={handleInfoClick}>
                                        <Info size={18} />
                                    </div>

                                    {/* Floating Translucent Block */}
                                    <div className="info-popover">
                                        ✨ Your itinerary will be intelligently generated using AI based on group votes, approvals, selected hotels, vehicle preferences, and optional budget settings. The Smart Itinerary Builder will try its best to create the most optimized trip experience while keeping the estimated total cost within your selected budget.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── MEMBER NOTIFICATION (Above View Result) ── */}
                        {/* ── STATUS BANNERS (Above View Result) ── */}
                        {!isAdmin && !isGenerated && !isGenerating && (
                            <div className="member-engagement-banner">
                                <Sparkles size={18} className="banner-icon" style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-warning)' }} />
                                <span>
                                    <strong style={{ color: 'var(--color-warning)', display: 'block', marginBottom: '0.25rem' }}>Shape your perfect trip!</strong>
                                    Suggest the places you'd love to visit and vote for your favorites. Our smart itinerary builder will craft a personalized group itinerary based on everyone's choices.
                                </span>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="member-engagement-banner">
                                <Loader2 size={18} className="banner-icon spin" style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-warning)' }} />
                                <span>
                                    <strong style={{ color: 'var(--color-warning)', display: 'block', marginBottom: '0.25rem' }}>Building your itinerary...</strong>
                                    The smart itinerary builder is working its best and will take several minutes to generate the itinerary. Feel free to explore other features in the meantime!
                                </span>
                            </div>
                        )}

                        {/* ── BOTTOM ROW: View Result (Full Width) ── */}
                        <button
                            className={`btn btn-view-result ${!isGenerated ? 'disabled-view-btn' : ''}`}
                            onClick={() => {
                                if (!isGenerated) {
                                    toast.info("The itinerary has not been generated yet.");
                                    return;
                                }
                                if (!statusData?.requestId) return;
                                navigate(`/trips/${tripId}/itinerary/${statusData.requestId}/results`);
                            }}
                            style={{ width: '100%', padding: '0.8rem' }}
                        >
                            <Sparkles size={18} /> View Generated Itinerary
                        </button>
                    </div>

                    {/* Delete Request Button */}
                    {isAdmin && (
                        <button
                            className="btn btn-delete-itin"
                            onClick={handleDeleteRequestClick}
                            disabled={actionLoading}
                            title="Delete itinerary request"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

            </div>

            {/* ════════════════════════════════════════
                BOTTOM HALF: Suggestions
               ════════════════════════════════════════ */}
            <div className="itin-suggestions-header">
                <h2 className='sub-section-heading'><Lightbulb size={20} /> Suggestions <span className="suggestion-count">{suggestions.length}</span></h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {suggestions.length === 0 ? (
                    <div className="glass-card itin-empty">
                        <Lightbulb size={40} className="text-muted" />
                        <p className="text-muted">No suggestions yet. Be the first to add one!</p>
                    </div>
                ) : (
                    suggestions.map(s => {
                        const approvalClass = s.adminApproved === true ? 'approved'
                            : s.adminApproved === false ? 'rejected' : '';

                        return (
                            <div key={s.id} className={`glass-card suggestion-card ${approvalClass}`}>
                                <div className="suggestion-info">
                                    <h3>
                                        {s.name}
                                        <span className="type-tag">{s.type}</span>
                                        {s.adminApproved === true && <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />}
                                        {s.adminApproved === false && <XCircle size={14} style={{ color: 'var(--color-danger)' }} />}
                                    </h3>
                                    {s.notes && <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.4rem 0' }}>{s.notes}</p>}
                                    <div className="suggester-info">
                                        {s.suggestedByImageUrl ? (
                                            <img src={s.suggestedByImageUrl} alt={s.suggestedByName} className="avatar-small" />
                                        ) : (
                                            <div className="avatar-small fallback">{s.suggestedByName[0]}</div>
                                        )}
                                        <span style={{ fontSize: '0.8rem' }}>
                                            {s.suggestedByUserId === user?.userId ? 'You' : s.suggestedByName}
                                        </span>
                                    </div>
                                </div>

                                <div className="suggestion-actions">
                                    {/* Vote */}
                                    <button
                                        className={`vote-btn ${s.hasCurrentUserVoted ? 'voted' : ''}`}
                                        onClick={() => handleVote(s.id)}
                                    >
                                        <ThumbsUp size={18} className={s.hasCurrentUserVoted ? 'fill-current' : ''} />
                                        <span>{s.voteCount}</span>
                                    </button>

                                    {/* Admin Review */}
                                    {isAdmin && isOpen && (
                                        <div className="admin-toggles">
                                            <button
                                                className={`icon-btn ${s.adminApproved === true ? 'active-success' : ''}`}
                                                onClick={() => handleAdminReview(s.id, true)}
                                                title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                className={`icon-btn ${s.adminApproved === false ? 'active-danger' : ''}`}
                                                onClick={() => handleAdminReview(s.id, false)}
                                                title="Reject"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Delete */}
                                    {(isAdmin || s.suggestedByUserId === user?.userId) && (
                                        <button className="icon-btn text-danger" onClick={() => handleDeleteSuggestionClick(s.id)} title="Delete suggestion">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* FAB — Add Suggestion */}
            {isOpen && (
                <button className="fab-button" onClick={() => setShowAddModal(true)} title="Add Suggestion">
                    <Plus size={26} />
                </button>
            )}

            {/* Add Suggestion Modal */}
            {showAddModal && (
                <AddSuggestionModal
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddSuggestion}
                />
            )}
            {confirmConfig.isOpen && (
                <ConfirmModal
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    isLoading={actionLoading}
                    variant={confirmConfig.actionType === 'deleteRequest' || confirmConfig.actionType === 'deleteSuggestion' ? 'danger' : 'primary'}
                    onConfirm={handleConfirmAction}
                    onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                />
            )}
        </div>

    );
}

/* ══════════════════════════════════════════════
   Inline Add Suggestion Modal
   ══════════════════════════════════════════════ */
function AddSuggestionModal({
    onClose,
    onSubmit,
}: {
    onClose: () => void;
    onSubmit: (dto: AddSuggestionDto) => Promise<void>;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<AddSuggestionDto>({ name: '', type: 'Place', notes: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSubmitting(true);
        try {
            await onSubmit(form);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Suggestion</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="suggestion-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="suggName">Place Name *</label>
                            <input
                                id="suggName"
                                className="input-field"
                                placeholder="e.g. Taj Mahal"
                                value={form.name}
                                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="suggType">Type</label>
                            <select
                                id="suggType"
                                className="input-field"
                                value={form.type}
                                onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="Place">Place</option>
                                <option value="Restaurant">Restaurant</option>
                                <option value="Activity">Activity</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Nightlife">Nightlife</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="suggNotes">Notes (optional)</label>
                        <input
                            id="suggNotes"
                            className="input-field"
                            placeholder="e.g. Must visit at sunset"
                            value={form.notes}
                            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={!form.name.trim() || submitting}>
                        {submitting
                            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="spin" /> Adding...
                            </span>
                            : 'Add Suggestion'
                        }
                    </button>
                </form>
            </div>

        </div>
    );
}
function ConfirmModal({
    title,
    message,
    onConfirm,
    onCancel,
    isLoading,
    variant = 'primary'
}: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'danger';
}) {
    if (variant === 'danger') {
        return (
            <div className="modal-overlay" onClick={onCancel}>
                <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: 'var(--color-danger)', marginBottom: '1rem' }}>
                        <AlertTriangle size={32} />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>{title}</h2>
                    <p className="text-muted" style={{ marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {message}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--glass-bg)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600 }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--color-danger)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {isLoading ? 'Processing...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onCancel} disabled={isLoading}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body" style={{ padding: '0.5rem 0 1.5rem', lineHeight: '1.6' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>{message}</p>
                </div>
                <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500 }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}
                    >
                        {isLoading ? <><Loader2 size={16} className="spin" /> Processing...</> : 'Proceed'}
                    </button>
                </div>
            </div>
        </div>
    );
}
