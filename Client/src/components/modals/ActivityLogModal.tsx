import { useEffect, useState } from "react";
import { Activity, X } from "lucide-react";
import { loggingService } from "../../services/loggingService";
import type { ActivityLogDto } from "../../types";

export default function ActivityLogModal({
    groupId,
    onClose,
}: {
    groupId: string;
    onClose: () => void;
}) {
    const [logs, setLogs] = useState<ActivityLogDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loggingService.getGroupLogs(groupId)
            .then(setLogs)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [groupId]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                <div className="modal-header pb-4 mb-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                        <Activity size={20} style={{ color: 'var(--color-primary)' }} /> Group Timeline
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-form" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                    {loading ? (
                        <div className="flex flex-col gap-4 py-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton" style={{ height: '3.5rem', borderRadius: '0.75rem' }} />
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="groups-no-results text-center py-8 opacity-60">
                            No activity recorded in this group yet.
                        </p>
                    ) : (
                        <div className="relative border-l-2 ml-4 pl-5 space-y-6 py-4" style={{ borderColor: 'var(--glass-border-light)' }}>
                            {logs.map((log) => (
                                <div key={log.id} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 transition-transform group-hover:scale-125" style={{ background: 'var(--color-primary)', borderColor: 'var(--color-surface)' }} />

                                    {/* Log Content */}
                                    <p className="text-[13px] leading-snug">
                                        <strong className="font-semibold" style={{ color: 'var(--color-primary)' }}>{log.userName}</strong> {log.description}
                                    </p>
                                    <span className="text-[10px] opacity-50 block mt-1">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
