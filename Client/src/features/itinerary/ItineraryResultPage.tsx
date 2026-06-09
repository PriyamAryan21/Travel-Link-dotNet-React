import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import itineraryService from '../../services/itineraryService';
import type { ItineraryResultDto, ItineraryDayDto, ItineraryItemDto, DroppedSuggestionDto } from '../../types';
import {
    ArrowLeft, MapPin, Calendar, Users, Wallet, Hotel, Car,
    Sparkles, Loader2, CheckCircle2, Circle, X, AlertTriangle,
    Clock, Eye, Camera, Utensils, Bus, Bed, ShoppingBag,
    TreePine, Landmark, Moon, Coffee, IndianRupee, ExternalLink
} from 'lucide-react';
import './itineraryResult.css';

/* ── Category → Icon Map ── */
const CATEGORY_ICON: Record<string, React.ReactNode> = {
    Sightseeing: <Camera size={16} />,
    Food: <Utensils size={16} />,
    Transport: <Bus size={16} />,
    Accommodation: <Bed size={16} />,
    Activity: <Sparkles size={16} />,
    Shopping: <ShoppingBag size={16} />,
    Nature: <TreePine size={16} />,
    Culture: <Landmark size={16} />,
    Rest: <Coffee size={16} />,
    NightLife: <Moon size={16} />,
};

const CATEGORY_COLOR: Record<string, string> = {
    Sightseeing: '#38bdf8',
    Food: '#f59e0b',
    Transport: '#a78bfa',
    Accommodation: '#6366f1',
    Activity: '#ec4899',
    Shopping: '#14b8a6',
    Nature: '#22c55e',
    Culture: '#e879f9',
    Rest: '#94a3b8',
    NightLife: '#f43f5e',
};

export default function ItineraryResultPage() {
    const { tripId, itineraryId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState<ItineraryResultDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(0);
    const [showDropped, setShowDropped] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (!itineraryId) return;
        (async () => {
            try {
                const data = await itineraryService.getResult(itineraryId);
                setResult(data);
            } catch {
            } finally {
                setLoading(false);
            }
        })();
    }, [itineraryId]);

    const handleToggleComplete = async (item: ItineraryItemDto) => {
        if (!result) return;
        try {
            await itineraryService.toggleItemComplete(item.id);
            // Optimistic update
            setResult(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    days: prev.days.map(d => ({
                        ...d,
                        items: d.items.map(i =>
                            i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i
                        ),
                    })),
                };
            });
        } catch {
            toast.error('Failed to update item');
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const formatDayDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="result-page">
                <div className="result-loading">
                    <div className="spin"><Loader2 size={32} /></div>
                    <p>Loading your itinerary...</p>
                </div>
            </div>
        );
    }

    /* ── Not found ── */
    if (!result) {
        return (
            <div className="result-page">
                <button className="result-back-btn" onClick={() => navigate(`/trips/${tripId}/itinerary/${itineraryId}`)}>
                    <ArrowLeft size={18} /> Back to Itinerary
                </button>
                <div className="glass-card result-empty">
                    <AlertTriangle size={40} />
                    <p>Itinerary result not found</p>
                </div>
            </div>
        );
    }

    const currentDay: ItineraryDayDto | null = result.days[activeDay] ?? null;
    const hasVehicle = !!result.vehicleType;

    const handleDelete = async () => {
        try {
            await itineraryService.deleteResult(itineraryId!);
            toast.success("Generated itinerary deleted successfully.");
            navigate(`/trips/${tripId}/itinerary/${itineraryId}`);
        } catch {
            // Error handled by unwrap toast
        } finally {
            setShowDeleteModal(false);
        }
    };

    return (
        <div className="result-page">
            {/* ── Top Bar ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button className="result-back-btn" onClick={() => navigate(`/trips/${tripId}/itinerary/${itineraryId}`)} style={{ marginBottom: 0 }}>
                    <ArrowLeft size={18} /> Back to Itinerary
                </button>

                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 text-red-500 rounded-lg transition-colors font-semibold border-none cursor-pointer"
                    style={{ padding: '0.65rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.9rem' }}
                >
                    <AlertTriangle size={16} /> Delete Generated Itinerary
                </button>
            </div>

            {/* ═══════════════════════════════════════
                HERO HEADER
               ═══════════════════════════════════════ */}
            <div className="glass-card result-hero">
                <div className="result-hero-top">
                    <div>
                        <h1 className="result-title">
                            <MapPin size={22} /> {result.destination}
                        </h1>
                        <div className="result-meta">
                            <span><Calendar size={14} /> {formatDate(result.startDate)} — {formatDate(result.endDate)}</span>
                            <span><Users size={14} /> {result.groupSize} travellers</span>
                            <span><Clock size={14} /> {result.totalDays} days</span>
                        </div>
                    </div>
                    <div className="result-generated-at">
                        Generated {formatDate(result.generatedAt)}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════
                BUDGET SUMMARY
               ═══════════════════════════════════════ */}
            <div className="result-budget-grid">
                <div className="glass-card budget-card budget-total">
                    <Wallet size={20} />
                    <div>
                        <span className="budget-label">Total Budget</span>
                        <span className="budget-value">₹{result.totalBudget.toLocaleString()}</span>
                    </div>
                </div>
                <div className="glass-card budget-card">
                    <Hotel size={20} />
                    <div>
                        <span className="budget-label">Hotel ({result.numberOfNights}N)</span>
                        <span className="budget-value">₹{result.hotelTotalCost.toLocaleString()}</span>
                    </div>
                </div>
                {hasVehicle && (
                    <div className="glass-card budget-card">
                        <Car size={20} />
                        <div>
                            <span className="budget-label">{result.vehicleType} × {result.vehicleCount}</span>
                            <span className="budget-value">₹{result.vehicleTotalCost.toLocaleString()}</span>
                        </div>
                    </div>
                )}
                <div className="glass-card budget-card">
                    <Sparkles size={20} />
                    <div>
                        <span className="budget-label">Activities</span>
                        <span className="budget-value">₹{result.estimatedActivityCost.toLocaleString()}</span>
                    </div>
                </div>
                <div className={`glass-card budget-card ${result.budgetRemaining >= 0 ? 'budget-positive' : 'budget-negative'}`}>
                    <IndianRupee size={20} />
                    <div>
                        <span className="budget-label">Remaining</span>
                        <span className="budget-value">₹{result.budgetRemaining.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* ── Per-person cost ── */}
            <div className="glass-card result-per-person">
                <span>Estimated cost per person</span>
                <strong>₹{result.estimatedCostPerPerson.toLocaleString()}</strong>
            </div>

            {/* ═══════════════════════════════════════
                DAY TABS
               ═══════════════════════════════════════ */}
            <div className="result-day-tabs">
                {result.days.map((day, idx) => (
                    <button
                        key={day.id}
                        className={`day-tab ${idx === activeDay ? 'active' : ''}`}
                        onClick={() => setActiveDay(idx)}
                    >
                        <span className="day-tab-num">Day {day.dayNumber}</span>
                        <span className="day-tab-date">{formatDayDate(day.date)}</span>
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════
                DAY CONTENT
               ═══════════════════════════════════════ */}
            {currentDay && (
                <div className="result-day-content">
                    <div className="day-header">
                        <h2 className="day-title">{currentDay.title}</h2>
                        {currentDay.weatherNote && (
                            <span className="day-weather">{currentDay.weatherNote}</span>
                        )}
                    </div>

                    <div className="day-items-grid">
                        {currentDay.items
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map(item => (
                                <div
                                    key={item.id}
                                    className={`glass-card day-item-card ${item.isCompleted ? 'completed' : ''}`}
                                >
                                    {/* Top Row */}
                                    <div className="item-top">
                                        <button
                                            className="item-check"
                                            onClick={() => handleToggleComplete(item)}
                                            title={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                        >
                                            {item.isCompleted
                                                ? <CheckCircle2 size={22} className="check-done" />
                                                : <Circle size={22} className="check-pending" />
                                            }
                                        </button>
                                        <div className="item-info">
                                            <h3 className="item-name">{item.placeName}</h3>
                                            <p className="item-desc">{item.description}</p>
                                        </div>
                                    </div>

                                    {/* Meta Row */}
                                    <div className="item-meta">
                                        <span
                                            className="item-category"
                                            style={{ color: CATEGORY_COLOR[item.category] || 'var(--color-text-muted)' }}
                                        >
                                            {CATEGORY_ICON[item.category] || <Eye size={16} />}
                                            {item.category}
                                        </span>
                                        <span className="item-duration">
                                            <Clock size={14} /> {formatDuration(item.durationMinutes)}
                                        </span>
                                        {item.estimatedCostPerPerson != null && (
                                            <span className="item-cost">
                                                <IndianRupee size={14} /> ₹{item.estimatedCostPerPerson.toLocaleString()}/pp
                                            </span>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {item.notes && (
                                        <p className="item-notes">{item.notes}</p>
                                    )}

                                    {/* Booking Link */}
                                    {item.bookingSearchQuery && (
                                        <a
                                            href={`https://www.google.com/search?q=${encodeURIComponent(item.bookingSearchQuery)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="item-booking-link"
                                        >
                                            <ExternalLink size={14} /> {item.bookingType ? `More info for ${item.bookingType}` : 'Search Booking'}
                                        </a>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════
                DROPPED SUGGESTIONS TRIGGER
               ═══════════════════════════════════════ */}
            {result.droppedSuggestions.length > 0 && (
                <button
                    className="btn-dropped-trigger"
                    onClick={() => setShowDropped(true)}
                >
                    <AlertTriangle size={16} />
                    View {result.droppedSuggestions.length} dropped suggestion{result.droppedSuggestions.length > 1 ? 's' : ''}
                </button>
            )}

            {/* ═══════════════════════════════════════
                DROPPED SUGGESTIONS MODAL
               ═══════════════════════════════════════ */}
            {showDropped && (
                <DroppedModal
                    suggestions={result.droppedSuggestions}
                    onClose={() => setShowDropped(false)}
                />
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: 'var(--color-danger)', marginBottom: '1rem' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>Delete Generated Itinerary?</h2>
                        <p className="text-muted" style={{ marginBottom: '1.75rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Are you sure you want to delete this itinerary? Your suggestions and votes will be kept, and you can generate a new one later.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--glass-bg)', color: 'var(--color-text)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--color-danger)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Delete Itinerary
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════
   Dropped Suggestions Modal
   ══════════════════════════════════════════════ */
function DroppedModal({
    suggestions,
    onClose,
}: {
    suggestions: DroppedSuggestionDto[];
    onClose: () => void;
}) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><AlertTriangle size={18} /> Dropped Suggestions</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="dropped-list">
                    {suggestions.map((s, i) => (
                        <div key={i} className="dropped-item">
                            <div className="dropped-name">{s.name}</div>
                            <div className="dropped-reason">{s.reason}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
