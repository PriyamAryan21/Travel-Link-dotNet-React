import { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { tripService } from '../../services/tripService';
import itineraryService from '../../services/itineraryService';
import type { TripDto, GroupItineraryStatusDto, CreateItineraryRequestDto } from '../../types';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Users,
    Wallet,
    Plane,
    Plus,
    X,
    Loader2,
    ClipboardList,
    Sparkles,
    DollarSign,
    Hotel,
    Car,
    Fuel,
    Trash2,
    IndianRupee,
} from 'lucide-react';
import { toast } from 'sonner';
import './trips.css';

export default function TripDetailPage() {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();

    const [trip, setTrip] = useState<TripDto | null>(null);
    const [itinerary, setItinerary] = useState<GroupItineraryStatusDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        if (!tripId) return;

        Promise.allSettled([
            tripService.getTripById(tripId),
            itineraryService.getTripStatus(tripId),
        ]).then(([tripResult, itinResult]) => {
            if (tripResult.status === 'fulfilled') setTrip(tripResult.value);
            if (itinResult.status === 'fulfilled') setItinerary(itinResult.value);
        }).finally(() => setLoading(false));
    }, [tripId]);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatShortDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const getDaysUntil = (dateStr: string) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Happening now';
        if (diff === 0) return 'Starts today';
        if (diff === 1) return 'Tomorrow';
        return `In ${diff} days`;
    };



    const handleDeleteItinerary = async (requestId: string) => {
        if (!confirm('Delete this itinerary request?')) return;
        try {
            await itineraryService.deleteRequest(requestId);
            setItinerary(null);
            toast.success('Itinerary request deleted');
        } catch { /* unwrap toasts */ }
    };

    const handleCreated = async () => {
        setShowCreate(false);
        try {
            const result = await itineraryService.getTripStatus(tripId!);
            setItinerary(result);
            toast.success('Itinerary request created!');
        } catch { }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="trip-detail">
                <div className="skeleton" style={{ height: '180px', borderRadius: '1.25rem' }} />
                <div className="skeleton" style={{ height: '1.5rem', width: '50%', marginTop: '1rem' }} />
                <div className="skeleton" style={{ height: '1rem', width: '30%', marginTop: '0.5rem' }} />
            </div>
        );
    }

    // ── Not Found ──
    if (!trip) {
        return (
            <div className="trip-detail">
                <button className="trip-detail-back" onClick={() => navigate('/trips')}>
                    <ArrowLeft size={18} /> Back to Trips
                </button>
                <div className="glass-card trips-empty">
                    <Plane size={40} className="dashboard-empty-icon" />
                    <p>Trip not found</p>
                </div>
            </div>
        );
    }

    const isUpcoming = new Date(trip.endDate) >= new Date();

    return (
        <div className="trip-detail">
            {/* Back */}
            <button className="trip-detail-back" onClick={() => navigate('/trips')}>
                <ArrowLeft size={18} /> Back to Trips
            </button>

            {/* ── Hero ── */}
            <div className="trip-detail-hero glass-card">
                <div className="trip-detail-hero-content">
                    <div className="trip-detail-destination">
                        <MapPin size={22} className="trip-icon" />
                        <h1 className="trip-detail-title">{trip.destination}</h1>
                    </div>
                    <p className="trip-detail-name">{trip.name}</p>
                    <div className="trip-detail-meta">
                        <span className="trip-detail-meta-item">
                            <Calendar size={15} />
                            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                        </span>
                        <span className="trip-detail-meta-item">
                            <Users size={15} />
                            {trip.groupName}
                        </span>
                    </div>
                    {isUpcoming && (
                        <span className="trip-detail-countdown">{getDaysUntil(trip.startDate)}</span>
                    )}
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="trip-detail-actions">
                <NavLink to={`/groups/${trip.groupId}`} className="trip-quick-action glass-card">
                    <Users size={18} />
                    <span>View Group</span>
                </NavLink>
                <NavLink to={`/expenses/group/${trip.groupId}`} className="trip-quick-action glass-card">
                    <Wallet size={18} />
                    <span>Expenses</span>
                </NavLink>
            </div>

            {/* ── Itineraries Section ── */}
            <section className="trip-detail-section">
                <div className="trip-detail-section-header">
                    <h2 className="trip-detail-section-title">
                        <ClipboardList size={18} /> Itinerary
                    </h2>
                    {!itinerary && (
                        <button className="trip-itin-create-btn" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> New Request
                        </button>
                    )}
                </div>

                {itinerary ? (
                    <NavLink
                        to={`/trips/${tripId}/itinerary/${itinerary.requestId}`}
                        className="glass-card itin-dashboard"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative', marginTop: '1rem' }}
                    >
                        {/* ── Top Row ── */}
                        <div className="itin-dashboard-top">
                            <h2 className="itin-destination">
                                <MapPin size={22} className="text-primary" />
                                {itinerary.destination}
                            </h2>
                            <span className={`status-badge ${itinerary.status.toLowerCase()}`}>
                                {itinerary.status === 'Open' ? "Collecting Suggestions" : itinerary.status === 'Generating' ? "Generating..." : itinerary.status}
                            </span>
                        </div>

                        {/* ── Stats Grid ── */}
                        <div className="dashboard-stats-grid">
                            <div className="stat-box">
                                <Calendar size={18} className="text-primary" />
                                <div>
                                    <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Date Range</p>
                                    <strong>
                                        {formatShortDate(itinerary.startDate)}
                                        {' — '}
                                        {formatShortDate(itinerary.endDate)}
                                    </strong>
                                </div>
                            </div>
                            <div className="stat-box">
                                <Wallet size={18} className="text-success" />
                                <div>
                                    <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Total Budget</p>
                                    <strong>₹{itinerary.totalBudget.toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>

                        {/* ── Suggestion Progress ── */}
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Sparkles size={14} className="text-warning" />Suggestions
                                </span>
                                <strong>{itinerary.approvedSuggestions} / {itinerary.totalSuggestions} Approved</strong>
                            </div>
                            <div className="progress-bg">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${itinerary.totalSuggestions > 0 ? (itinerary.approvedSuggestions / itinerary.totalSuggestions) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* ── Delete Button ── */}
                        <button
                            className="trip-itin-delete"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteItinerary(itinerary.requestId);
                            }}
                            title="Delete request"
                            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </NavLink>
                ) : (
                    <div className="glass-card trips-empty" style={{ padding: '1.5rem' }}>
                        <Sparkles size={32} className="dashboard-empty-icon" />
                        <p>No itinerary requests yet</p>
                        <button className="dashboard-empty-link" onClick={() => setShowCreate(true)}>
                            Create your first itinerary request →
                        </button>
                    </div>
                )}

            </section>

            {/* ── Create Itinerary Modal ── */}
            {showCreate && tripId && (
                <CreateItineraryModal
                    tripId={tripId}
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}


/* ── Create Itinerary Request Modal ── */
function CreateItineraryModal({
    tripId,
    onClose,
    onCreated,
}: {
    tripId: string;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [showVehicle, setShowVehicle] = useState(false);

    const [form, setForm] = useState<CreateItineraryRequestDto>({
        tripId,
        totalBudget: 0,
        dailyHotelCostPerRoom: undefined,
        numberOfRooms: undefined,
        vehicleType: undefined,
        vehicleCount: undefined,
        isRental: false,
        dailyRentalCostPerVehicle: undefined,
        dailyFuelCostPerVehicle: undefined,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? Number(value) : undefined)
                : type === 'checkbox' ? (e.target as HTMLInputElement).checked
                    : value,
        }));
    };

    const canSubmit = form.totalBudget > 0 && !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        try {
            await itineraryService.createRequest(form);
            onCreated();
        } catch { /* unwrap toasts */ }
        finally { setSubmitting(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Itinerary Request</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Budget */}
                    <div className="form-group">
                        <label htmlFor="totalBudget"> Total Budget (₹) *
                        </label>
                        <input
                            id="totalBudget"
                            name="totalBudget"
                            type="number"
                            min={0}
                            placeholder="e.g. 50000"
                            value={form.totalBudget || ''}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Accommodation */}
                    <fieldset className="trip-form-fieldset">
                        <legend className="trip-form-legend">
                            <Hotel size={14} /> Accommodation (optional)
                        </legend>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="dailyHotelCostPerRoom">Daily Cost / Room (₹)</label>
                                <input
                                    id="dailyHotelCostPerRoom"
                                    name="dailyHotelCostPerRoom"
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 3000"
                                    value={form.dailyHotelCostPerRoom ?? ''}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="numberOfRooms">No. of Rooms</label>
                                <input
                                    id="numberOfRooms"
                                    name="numberOfRooms"
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 2"
                                    value={form.numberOfRooms ?? ''}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Vehicle toggle */}
                    <button
                        type="button"
                        className="trip-form-toggle"
                        onClick={() => setShowVehicle(!showVehicle)}
                    >
                        <Car size={14} />
                        {showVehicle ? 'Hide vehicle details' : 'Add vehicle details (optional)'}
                    </button>

                    {showVehicle && (
                        <fieldset className="trip-form-fieldset">
                            <legend className="trip-form-legend">
                                <Car size={14} /> Vehicle
                            </legend>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="vehicleType">Type (Leave blank for public transport)</label>
                                    <select
                                        id="vehicleType"
                                        name="vehicleType"
                                        value={form.vehicleType ?? ''}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option value="">Select</option>
                                        <option value="Car">Car (4 seater)</option>
                                        <option value="SUV">SUV (6 seater)</option>
                                        <option value="Scooty">Bike/Scooty (2 seater)</option>
                                        <option value="Traveller">Traveller</option>

                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vehicleCount">Count</label>
                                    <input
                                        id="vehicleCount"
                                        name="vehicleCount"
                                        type="number"
                                        min={1}
                                        placeholder="e.g. 1"
                                        value={form.vehicleCount ?? ''}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="trip-form-checkbox">
                                    <input
                                        type="checkbox"
                                        name="isRental"
                                        checked={form.isRental ?? false}
                                        onChange={handleChange}
                                    />
                                    <span>This is a rental vehicle</span>
                                </label>
                            </div>

                            {form.isRental && (
                                <div className="form-group">
                                    <label htmlFor="dailyRentalCostPerVehicle">Daily Rental Cost / Vehicle (₹)</label>
                                    <input
                                        id="dailyRentalCostPerVehicle"
                                        name="dailyRentalCostPerVehicle"
                                        type="number"
                                        min={0}
                                        placeholder="e.g. 2500"
                                        value={form.dailyRentalCostPerVehicle ?? ''}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="dailyFuelCostPerVehicle">
                                    <Fuel size={14} /> Daily Fuel Cost / Vehicle (₹)
                                </label>
                                <input
                                    id="dailyFuelCostPerVehicle"
                                    name="dailyFuelCostPerVehicle"
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 800"
                                    value={form.dailyFuelCostPerVehicle ?? ''}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                        </fieldset>
                    )}

                    <button type="submit" className="btn-primary" disabled={!canSubmit}>
                        {submitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="spin" /> Creating...
                            </span>
                        ) : (
                            'Create Request'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
