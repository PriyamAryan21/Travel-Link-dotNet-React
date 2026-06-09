import { useEffect, useState } from 'react';
import { tripService } from '../../services/tripService';
import groupService from '../../services/groupService';
import { NavLink } from 'react-router-dom';
import type { TripDto, GroupDto, CreateTripDto } from '../../types';
import {
    Plane,
    MapPin,
    Calendar,
    Users,
    Plus,
    X,
    Trash2,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import './trips.css';
import CreateTripModal from '../../components/modals/CreateTripModal';

type TabType = 'upcoming' | 'past';

export default function TripsPage() {
    const [trips, setTrips] = useState<TripDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const [showCreate, setShowCreate] = useState(false);

    const loadTrips = () => {
        setLoading(true);
        tripService.getMyTrips()
            .then(setTrips)
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadTrips();
    }, []);

    const now = new Date();

    const upcomingTrips = trips
        .filter(t => new Date(t.endDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const pastTrips = trips
        .filter(t => new Date(t.endDate) < now)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    const displayedTrips = activeTab === 'upcoming' ? upcomingTrips : pastTrips;

    const getDaysUntil = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return 'Happening now';
        if (diff === 0) return 'Starts today';
        if (diff === 1) return 'Tomorrow';
        return `In ${diff} days`;
    };

    const formatShortDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const handleDelete = async (tripId: string) => {
        if (!confirm('Are you sure you want to delete this trip?')) return;
        try {
            await tripService.deleteTrip(tripId);
            setTrips(prev => prev.filter(t => t.id !== tripId));
            toast.success('Trip deleted');
        } catch {
            /* unwrap already toasts */
        }
    };

    const handleCreated = () => {
        // Fetch fresh trips from server to ensure all fields (id, groupName, etc) are correct
        tripService.getMyTrips().then(setTrips);
        setShowCreate(false);
        toast.success('Trip created!');
    };



    return (
        <div className="trips-page">
            {/* Header with tabs and create button */}
            <div className="trips-header">
                <div className="trips-tabs">
                    <button
                        className={`trips-tab ${activeTab === 'upcoming' ? 'trips-tab-active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                        {upcomingTrips.length > 0 && (
                            <span className="trips-tab-count">{upcomingTrips.length}</span>
                        )}
                    </button>
                    <button
                        className={`trips-tab ${activeTab === 'past' ? 'trips-tab-active' : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        Past
                        {pastTrips.length > 0 && (
                            <span className="trips-tab-count">{pastTrips.length}</span>
                        )}
                    </button>
                </div>
                <button className="trips-create-btn" onClick={() => setShowCreate(true)}>
                    <Plus size={18} />
                    <span>New Trip</span>
                </button>
            </div>

            {/* Trip Cards */}
            {loading ? (
                <div className="trips-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card trip-card-skeleton">
                            <div className="skeleton" style={{ height: '1.25rem', width: '60%' }} />
                            <div className="skeleton" style={{ height: '0.9rem', width: '40%', marginTop: '0.5rem' }} />
                            <div className="skeleton" style={{ height: '0.9rem', width: '80%', marginTop: '0.5rem' }} />
                        </div>
                    ))}
                </div>
            ) : displayedTrips.length > 0 ? (
                <div className="trips-grid">
                    {displayedTrips.map(trip => (
                        <NavLink
                            key={trip.id}
                            to={`/trips/${trip.id}`}
                            className="glass-card trip-card"
                            style={{ textDecoration: `none`, color: 'inherit' }}
                        >
                            <div className="trip-card-header">
                                <div className="trip-card-destination">
                                    <MapPin size={16} className="trip-icon" />
                                    <h3>{trip.destination}</h3>
                                </div>
                                {activeTab === 'upcoming' && (
                                    <span className="trip-card-badge">{getDaysUntil(trip.startDate)}</span>
                                )}
                            </div>
                            <p className="trip-card-name">{trip.name}</p>
                            <div className="trip-card-meta">
                                <span className="trip-card-dates">
                                    <Calendar size={14} />
                                    {formatShortDate(trip.startDate)} — {formatShortDate(trip.endDate)}
                                </span>
                                <span className="trip-card-group">
                                    <Users size={14} />
                                    {trip.groupName}
                                </span>
                            </div>
                            <div className="trip-card-actions">
                                {trip.hasItinerary && (
                                    <span className="trip-itinerary-badge">📋 Has Itinerary</span>
                                )}
                                <button
                                    className="trip-delete-btn"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(trip.id); }}
                                    title="Delete trip"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </NavLink>
                    ))}
                </div>
            ) : (
                <div className="glass-card trips-empty">
                    <Plane size={40} className="dashboard-empty-icon" />
                    <p>{activeTab === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'}</p>
                    {activeTab === 'upcoming' && (
                        <button className="dashboard-empty-link" onClick={() => setShowCreate(true)}>
                            Plan your first trip →
                        </button>
                    )}
                </div>
            )}

            {/* Create Trip Modal */}
            {showCreate && (
                <CreateTripModal
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}


