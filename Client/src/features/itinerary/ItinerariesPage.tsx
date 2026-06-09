import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import itineraryService from '../../services/itineraryService';
import type { UserItinerarySummaryDto } from '../../types';
import { toast } from 'sonner';
import { Calendar, MapPin, Wallet, Lightbulb, Sparkles, Navigation, Loader2 } from 'lucide-react';
import './tripItinerary.css';

export default function ItinerariesPage() {
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState<UserItinerarySummaryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const loadData = () => {
        setLoading(true);
        itineraryService.getUserItineraries()
            .then(data => setItineraries(data))
            .catch(() => { /* unwrap already handles toast */ })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleGenerate = async (requestId: string) => {
        setGeneratingId(requestId);
        try {
            await itineraryService.generate(requestId, { note: null });
            toast.success("Itinerary generated successfully!");
            loadData();
        } catch (err: any) {
            // unwrap handles toast
        } finally {
            setGeneratingId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="spin"><Loader2 size={32} /></div>
            </div>
        );
    }

    if (itineraries.length === 0) {
        return (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}>
                <Navigation size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem auto' }} />
                <h2>No Itineraries Found</h2>
                <p className="text-muted">You don't have any active itineraries or requests yet.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/groups')}>
                    Go to Groups
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 className='section-header'> My Itineraries </h1>
                </h1>
                <p className="text-muted">Manage your upcoming trip plans and destination votes.</p>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {itineraries.map(it => {
                    const isGenerated = it.status === "Generated";
                    const isGenerating = it.status === "Generating" || generatingId === it.requestId;
                    const isOpen = it.status === "Open";

                    return (
                        <div key={it.requestId} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
                            {/* Top Badge Row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    backgroundColor: isGenerated ? 'rgba(40, 167, 69, 0.15)' : isOpen ? 'rgba(253, 126, 20, 0.15)' : 'rgba(255, 193, 7, 0.15)',
                                    color: isGenerated ? 'var(--color-success)' : isOpen ? 'var(--color-warning)' : '#ffc107',
                                }}>
                                    {isGenerated ? "Generated" : isOpen ? "Collecting Suggestions" : "Processing"}
                                </span>
                                {it.isAdmin && <span className="text-muted" style={{ fontSize: '0.7rem', border: '1px solid', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>ADMIN</span>}
                            </div>

                            {/* Main Info */}
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <MapPin size={20} className="text-primary" /> {it.destination}
                                </h3>
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                                    {it.groupName}
                                </p>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> Dates</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                                        {new Date(it.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(it.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Wallet size={14} /> Budget</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>₹{it.totalBudget.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Suggestions Progress */}
                            {isOpen && (
                                <div style={{ padding: '0.5rem 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Lightbulb size={14} className="text-warning" /> Suggestions</span>
                                        <span>{it.approvedSuggestions} / {it.totalSuggestions} Approved</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${it.totalSuggestions > 0 ? (it.approvedSuggestions / it.totalSuggestions) * 100 : 0}%`,
                                            height: '100%',
                                            backgroundColor: 'var(--color-warning)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.6rem' }}
                                    onClick={() => navigate(`/trips/${it.tripId}/itinerary/${it.requestId}`)}
                                >
                                    View Itinerary
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
