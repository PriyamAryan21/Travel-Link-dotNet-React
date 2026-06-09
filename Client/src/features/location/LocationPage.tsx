import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import groupService from '../../services/groupService';
import type { GroupDto, FriendDto } from '../../types';
import friendService from '../../services/friendService';
import { toast } from 'sonner';
import { Users, User, LogOut, ArrowLeft, Loader2, Navigation, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './location.css';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A simple event emitter to avoid global React state updates for every location change
class LocationEventEmitter {
    private listeners: Record<string, ((loc: any) => void)[]> = {};

    subscribe(userId: string, callback: (loc: any) => void) {
        if (!this.listeners[userId]) this.listeners[userId] = [];
        this.listeners[userId].push(callback);
        return () => {
            this.listeners[userId] = this.listeners[userId].filter(cb => cb !== callback);
        };
    }

    emit(userId: string, loc: any) {
        if (this.listeners[userId]) {
            this.listeners[userId].forEach(cb => cb(loc));
        }
    }
}

const locationEvents = new LocationEventEmitter();

// --- OPTIMIZED MARKER COMPONENT ---
// This component only re-renders itself when its specific user moves, 
// leaving the rest of the Map and other markers untouched!
const LiveUserMarker = ({ userId, initialLocation, mapInstance }: { userId: string, initialLocation: any, mapInstance: L.Map | null }) => {
    const [location, setLocation] = useState(initialLocation);

    useEffect(() => {
        const unsubscribe = locationEvents.subscribe(userId, (newLoc) => {
            setLocation(newLoc);
        });
        return unsubscribe;
    }, [userId]);

    if (!location) return null;

    // Create a custom icon using the user's avatar
    const customIcon = L.divIcon({
        className: 'custom-avatar-marker',
        html: `
            <div class="marker-pin ${location.speed && location.speed > 5 ? 'moving-fast' : 'standing'}">
                ${location.imageUrl
                ? `<img src="${location.imageUrl}" alt="${location.userName}" />`
                : `<div class="fallback-avatar">${location.userName.charAt(0).toUpperCase()}</div>`
            }
            </div>
            <div class="marker-pulse"></div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });

    return (
        <Marker position={[location.lat, location.lng]} icon={customIcon} zIndexOffset={1000}>
            <Popup className="custom-popup">
                <div className="font-sans">
                    <strong className="block text-sm mb-1">{location.userName}</strong>
                    <div className="text-xs text-gray-500 flex flex-col gap-1">
                        <span className="flex items-center gap-1"><Activity size={12} /> {location.speed ? Math.round(location.speed * 3.6) + ' km/h' : 'Stationary'}</span>
                        <span className="flex items-center gap-1"><Navigation size={12} /> Acc: {Math.round(location.accuracy)}m</span>
                        <span className="text-[9px] mt-1 opacity-60">Updated: {new Date(location.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};


// Component to capture the map instance to pass to markers or auto-pan
const MapController = ({ setMapInstance }: { setMapInstance: (map: L.Map) => void }) => {
    const map = useMap();
    useEffect(() => {
        setMapInstance(map);
    }, [map, setMapInstance]);
    return null;
};


export default function LocationPage() {
    const { user } = useAuth();
    const { hubConnection } = useNotifications(); // We will expose this from the context!
    const navigate = useNavigate();

    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

    // Session state
    const [sessionType, setSessionType] = useState<'none' | 'group' | 'private'>('none');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // UI state for dropdowns
    const [groups, setGroups] = useState<GroupDto[]>([]);
    const [friends, setFriends] = useState<FriendDto[]>([]);

    // Store the latest locations without triggering full React re-renders
    const locationsRef = useRef<Map<string, any>>(new Map());

    // Tracking loop reference to clear on unmount
    const watchIdRef = useRef<number | null>(null);
    const lastSentRef = useRef<{ lat: number, lng: number, time: number } | null>(null);

    // Haversine distance formula to calculate movement distance
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const p1 = lat1 * Math.PI / 180;
        const p2 = lat2 * Math.PI / 180;
        const dp = (lat2 - lat1) * Math.PI / 180;
        const dl = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        // Load groups and friends for the session selectors
        groupService.getMyGroups().then(setGroups).catch(() => { });
        friendService.getFriends().then(setFriends).catch(() => { });
    }, []);

    // --- SIGNALR EVENT LISTENERS ---
    useEffect(() => {
        if (!hubConnection) return;

        const handleLocationUpdate = (loc: any) => {
            locationsRef.current.set(loc.userId, loc);
            // If it's a new user we haven't rendered a marker for yet, update the Set to mount their marker
            setActiveUsers(prev => {
                if (!prev.has(loc.userId)) {
                    const next = new Set(prev);
                    next.add(loc.userId);
                    return next;
                }
                return prev;
            });
            // Emit directly to that specific user's marker! (Zero overhead)
            locationEvents.emit(loc.userId, loc);
        };

        const handleUserJoined = (userId: string) => {
            toast.info("A user joined the location session");
        };

        const handleUserLeft = (userId: string) => {
            toast.info("A user left the session");
            locationsRef.current.delete(userId);
            setActiveUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        };

        const handleError = (msg: string) => {
            toast.error(msg);
            setIsConnecting(false);
            stopSharing();
        };

        hubConnection.on("LocationUpdate", handleLocationUpdate);
        hubConnection.on("UserJoined", handleUserJoined);
        hubConnection.on("UserLeft", handleUserLeft);
        hubConnection.on("Error", handleError);
        hubConnection.on("SessionLeft", () => toast("You left the location session"));

        return () => {
            hubConnection.off("LocationUpdate", handleLocationUpdate);
            hubConnection.off("UserJoined", handleUserJoined);
            hubConnection.off("UserLeft", handleUserLeft);
            hubConnection.off("Error", handleError);
            hubConnection.off("SessionLeft");
        };
    }, [hubConnection]);


    // --- GPS OPTIMIZED SHARING LOGIC ---
    const startSharing = async (type: 'group' | 'private', targetId: string) => {
        if (!hubConnection || hubConnection.state !== "Connected") {
            toast.error("Real-time connection not ready");
            return;
        }

        setIsConnecting(true);
        try {
            if (type === 'group') {
                await hubConnection.invoke("JoinGroupSession", targetId);
            } else {
                await hubConnection.invoke("JoinPrivateSession", targetId);
            }

            setSessionType(type);
            setSessionId(targetId);
            toast.success("Joined location session!");

            // Start reading GPS
            startGpsTracking();

        } catch (error) {
            toast.error("Failed to join session");
        } finally {
            setIsConnecting(false);
        }
    };

    const stopSharing = async () => {
        if (hubConnection && hubConnection.state === "Connected" && sessionType !== 'none') {
            try {
                await hubConnection.invoke("LeaveSession");
            } catch (e) { }
        }

        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setSessionType('none');
        setSessionId(null);
        setActiveUsers(new Set());
        locationsRef.current.clear();
        lastSentRef.current = null;
    };

    const startGpsTracking = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy, speed } = position.coords;
                const now = Date.now();

                // Pan map to my first location
                if (!lastSentRef.current && mapInstance) {
                    mapInstance.flyTo([latitude, longitude], 15);
                }

                // --- OPTIMIZATION ALGORITHM ---
                let intervalRequired = 30000; // Default: standing still (30s)

                if (document.visibilityState === 'hidden') {
                    intervalRequired = 60000; // Backgrounded (60s)
                } else if (speed !== null) {
                    if (speed > 5) intervalRequired = 3000;       // Driving > ~18km/h (3s)
                    else if (speed > 1) intervalRequired = 10000; // Walking (10s)
                }

                let shouldSend = false;

                if (!lastSentRef.current) {
                    shouldSend = true;
                } else {
                    const timeElapsed = now - lastSentRef.current.time;
                    const distanceMoved = getDistance(latitude, longitude, lastSentRef.current.lat, lastSentRef.current.lng);

                    // Ignore tiny GPS drifts (< 12 meters) unless a lot of time passed
                    if (distanceMoved > 12 && timeElapsed >= intervalRequired) {
                        shouldSend = true;
                    } else if (timeElapsed >= 30000) {
                        // Force a heartbeat every 30s even if stationary
                        shouldSend = true;
                    }
                }

                // Create my own payload
                const myLoc = {
                    userId: user!.userId,
                    userName: user!.name,
                    imageUrl: user!.imageUrl,
                    lat: latitude,
                    lng: longitude,
                    accuracy: accuracy,
                    speed: speed,
                    timestamp: new Date().toISOString()
                };

                // Emit locally to update my own marker on the map instantly
                locationsRef.current.set(myLoc.userId, myLoc);
                setActiveUsers(prev => prev.has(myLoc.userId) ? prev : new Set(prev).add(myLoc.userId));
                locationEvents.emit(myLoc.userId, myLoc);

                // Broadcast to hub if needed
                if (shouldSend && hubConnection?.state === "Connected") {
                    hubConnection.invoke("SendLocation", myLoc).catch(console.error);
                    lastSentRef.current = { lat: latitude, lng: longitude, time: now };
                }
            },
            (error) => {
                console.error("GPS Error:", error);
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error("Location permission denied. Please enable GPS access.");
                } else if (!window.isSecureContext) {
                    toast.error("Location requires a secure connection (HTTPS). Local network testing needs SSL.");
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
            if (sessionType !== 'none' && hubConnection?.state === "Connected") {
                hubConnection.invoke("LeaveSession").catch(() => { });
            }
        };
    }, []);

    const [isRadarExpanded, setIsRadarExpanded] = useState(true);

    return (
        // Edge-to-Edge Full Screen Container
        <div className="fixed inset-0 z-0 bg-[var(--color-surface)]">
            <MapContainer
                center={[20, 0]}
                zoom={3}
                zoomControl={false}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapController setMapInstance={setMapInstance} />

                {Array.from(activeUsers).map(id => (
                    <LiveUserMarker
                        key={id}
                        userId={id}
                        initialLocation={locationsRef.current.get(id)}
                        mapInstance={mapInstance}
                    />
                ))}
            </MapContainer>

            {/* Overlays & Controls */}
            {/* Using fixed positioning to sit perfectly under the TopBar (approx 70px) and account for Sidebar on Desktop (approx 260px) */}
            <div className="fixed top-[85px] left-0 right-0 px-4 md:px-6 z-[1000] flex justify-between items-start pointer-events-none lg:pl-[280px]">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="glass-card rounded-full shadow-lg pointer-events-auto hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-center p-0"
                    style={{ width: '40px', height: '40px', background: 'var(--color-surface-elevated)' }}
                >
                    <ArrowLeft size={18} />
                </button>

                {/* Live Radar Tab (Collapsible) */}
                <div
                    className="glass-card rounded-[1.5rem] shadow-2xl pointer-events-auto transition-all duration-300 overflow-hidden"
                    style={{
                        width: '260px',
                        padding: isRadarExpanded ? '1rem' : '0.75rem 1rem',
                        background: 'var(--color-surface-elevated)',
                        borderColor: 'var(--glass-border)'
                    }}
                >
                    <div
                        className="flex items-center justify-between cursor-pointer select-none"
                        onClick={() => setIsRadarExpanded(!isRadarExpanded)}

                    >
                        <h1 className="font-bold text-[14px] flex items-center gap-2 m-0">
                            <Navigation size={16} className="text-[var(--color-primary)]" />
                            Live Radar
                        </h1>
                        <div className={`transform transition-transform ${isRadarExpanded ? 'rotate-180 opacity-50' : 'opacity-100'}`}>
                            <Activity size={14} className={!isRadarExpanded && sessionType !== 'none' ? 'text-green-500 animate-pulse' : ''} />
                        </div>
                    </div>

                    {isRadarExpanded && (
                        <div className="mt-4 flex flex-col gap-4 animate-fade-in-up">
                            {sessionType === 'none' ? (
                                <>
                                    <p className="text-[11px] opacity-70 mb-1 leading-relaxed">Select a session to start sharing your location.</p>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-50">Group Session</label>
                                        <select
                                            className="input-field py-1.5 px-3 text-xs"
                                            onChange={(e) => {
                                                if (e.target.value) startSharing('group', e.target.value);
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>Join a Group...</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-50">Private Session</label>
                                        <select
                                            className="input-field py-1.5 px-3 text-xs"
                                            onChange={(e) => {
                                                if (e.target.value) startSharing('private', e.target.value);
                                            }}
                                            value=""
                                        >
                                            <option value="" disabled>Share with Friend...</option>
                                            {friends.map(f => (
                                                <option key={f.userId} value={f.userId}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-[var(--glass-border)]">
                                        <div>
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)] block mb-0.5">
                                                {sessionType} Active
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                <span className="text-xs font-semibold">Broadcasting</span>
                                            </div>
                                        </div>
                                        <div className="text-right pr-1">
                                            <span className="text-sm font-bold block leading-none">{activeUsers.size}</span>
                                            <span className="text-[9px] opacity-60">Users</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={stopSharing}
                                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold transition-colors flex justify-center items-center gap-1.5 text-xs"
                                    >
                                        <LogOut size={14} /> Stop Sharing
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Status Bar (Moves up on mobile to avoid bottom-nav) */}
            {sessionType !== 'none' && (
                <div className="fixed bottom-[90px] lg:bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none lg:pl-[260px]">
                    <div className="glass-card px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-[10px] font-medium" style={{ background: 'var(--color-surface-elevated)' }}>
                        <Activity size={12} className="text-[var(--color-primary)] animate-pulse" />
                        <span>Optimized GPS Active</span>
                    </div>
                </div>
            )}
        </div>
    );
}
