import { useEffect, useState } from "react";
import type { CreateTripDto, GroupDto } from "../../types";
import groupService from "../../services/groupService";
import { tripService } from "../../services/tripService";
import { Loader2, X } from "lucide-react";

export default function CreateTripModal({
    onClose,
    onCreated,
    initialGroupId = '',
}: {
    onClose: () => void;
    onCreated: () => void;
    initialGroupId?: string;
}) {
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState<CreateTripDto>({
        groupId: initialGroupId,
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        groupService.getMyGroups()
            .then(setGroups)
            .catch(() => { })
            .finally(() => setLoadingGroups(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const canSubmit = form.groupId && form.name.trim() && form.destination.trim()
        && form.startDate && form.endDate && !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        try {
            await tripService.createTrip(form);
            onCreated();
        } catch {
            /* unwrap already toasts */
        } finally {
            setSubmitting(false);
        }
    };

    // Get today's date in YYYY-MM-DD for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create a Trip</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Group Select */}
                    <div className="form-group">
                        <label htmlFor="groupId">Group</label>
                        {loadingGroups ? (
                            <div className="skeleton" style={{ height: '2.75rem', borderRadius: '0.75rem' }} />
                        ) : groups.length === 0 ? (
                            <p className="form-hint" style={{ color: 'var(--color-warning)' }}>
                                You need to create a group first before planning a trip.
                            </p>
                        ) : (
                            <select
                                id="groupId"
                                name="groupId"
                                value={form.groupId}
                                onChange={handleChange}
                                className="input-field"
                                required
                            >
                                <option value="">Select a group</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Trip Name */}
                    <div className="form-group">
                        <label htmlFor="name">Trip Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="e.g. Summer Getaway 2026"
                            value={form.name}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Destination */}
                    <div className="form-group">
                        <label htmlFor="destination">Destination</label>
                        <input
                            id="destination"
                            name="destination"
                            type="text"
                            placeholder="e.g. Bali, Indonesia"
                            value={form.destination}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                    </div>

                    {/* Date Row */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <div className="form-group flex-1 min-w-0 w-full">
                            <label htmlFor="startDate">Start Date</label>
                            <input
                                id="startDate"
                                name="startDate"
                                type="date"
                                min={today}
                                value={form.startDate}
                                onChange={handleChange}
                                className="input-field w-full"
                                required
                            />
                        </div>
                        <div className="form-group flex-1 min-w-0 w-full">
                            <label htmlFor="endDate">End Date</label>
                            <input
                                id="endDate"
                                name="endDate"
                                type="date"
                                min={form.startDate || today}
                                value={form.endDate}
                                onChange={handleChange}
                                className="input-field w-full"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!canSubmit}
                    >
                        {submitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="spin" /> Creating...
                            </span>
                        ) : (
                            'Create Trip'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}