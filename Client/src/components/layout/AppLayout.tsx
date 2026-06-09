import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard,
    Plane,
    Users,
    UserPlus,
    MapPin,
    UserCircle,
    Sun,
    Moon,
    Monitor,
    LogOut,
    Wallet,
    CalendarRange,
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const mainNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/trips', label: 'Trips', icon: Plane },
    { to: '/groups', label: 'Groups', icon: Users },
    { to: '/expenses', label: 'Expenses', icon: Wallet },
    { to: '/itineraries', label: 'Itineraries', icon: CalendarRange },
    { to: '/friends', label: 'Friends', icon: UserPlus },
    { to: '/location', label: 'Live Map', icon: MapPin },
];

const bottomNav = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/expenses', label: 'Expenses', icon: Wallet },
    { to: '/location', label: 'Live Map', icon: MapPin },
    { to: '/friends', label: 'Friends', icon: UserPlus },
    { to: '/profile', label: 'Profile', icon: UserCircle },
]

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const cycle = () => {
        const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
        setTheme(next);
    };

    const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

    return (
        <button
            onClick={cycle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'}`}
        >
            <Icon size={18} />
        </button>
    );
}

/* Put this above the Sidebar function */
function UserAvatar({ size = 36 }: { size?: number }) {
    const { user } = useAuth();
    const initial = user?.name?.charAt(0).toUpperCase() || 'U';
    console.log(user);
    if (user?.imageUrl) {
        return (
            <img
                src={user.imageUrl}
                alt={user.name}
                className="user-avatar-img"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div className="user-avatar-fallback" style={{ width: size, height: size }}>
            {initial}
        </div>
    );
}


function Sidebar() {
    const { logout, user } = useAuth();

    return (
        <aside className='sidebar'>
            <div className="sidebar-logo">

                <NavLink
                    to={'/dashboard'}
                    className='logo-link'
                >
                    <h1 className="flex select-none items-baseline justify-center drop-shadow-md">
                        <span className='font-cardo font-bold text-4xl' style={{ color: 'var(--logo-travel-color)' }}>Travel</span>
                        <span className="font-vibes font-bold text-nature-gradient text-4xl">Link</span>
                    </h1>
                </NavLink>
            </div>

            <nav className="sidebar-nav">
                {mainNav.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                        }
                    >
                        <item.icon size={20} />
                        <span className="sidebar-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                    }
                >
                    <UserAvatar size={20} />
                    <span className="sidebar-label">{user?.name || 'Profile'}</span>
                </NavLink>
                <button onClick={logout} className="sidebar-item sidebar-logout">
                    <LogOut size={20} />
                    <span className="sidebar-label">Logout</span>
                </button>
            </div>
        </aside>
    )
}


function TopBar() {
    const location = useLocation();
    const { user } = useAuth();

    const getTitle = () => {
        const path = location.pathname.split('/')[1] || 'dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1);
    }

    return (
        <header className='topbar'>
            <div className="topbar-logo-mobile">
                <NavLink to='/dashboard' className='logo-link'>
                    <h1 className="flex select-none items-baseline justify-center drop-shadow-md">
                        <span className='font-cardo font-bold text-2xl' style={{ color: 'var(--logo-travel-color)' }}>Travel</span>
                        <span className="font-vibes font-bold text-nature-gradient text-2xl">Link</span>
                    </h1>
                </NavLink>
            </div>

            <h1 className="topbar-title">{getTitle()}</h1>

            {/* Right actions */}
            <div className="topbar-actions flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
                <NavLink to="/profile" className="topbar-avatar-link">
                    <UserAvatar size={36} />
                </NavLink>
            </div>
        </header>
    );
}

function MobileBottomNav() {
    return (
        <nav className="bottom-nav">
            {bottomNav.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `bottom-nav-item ${isActive ? 'bottom-nav-active' : ''}`
                    }
                >
                    {item.to === '/profile' ? (
                        <UserAvatar size={22} />
                    ) : (
                        <item.icon size={20} />
                    )}
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}


export default function AppLayout() {
    return (
        <div className="app-shell">
            {/* Animated background */}
            <div className="app-bg" />
            {/* Desktop sidebar */}
            < Sidebar />
            {/* Main content area */}
            < div className="main-wrapper" >
                <TopBar />
                <main className="main-content">
                    <Outlet />
                </main>
            </div >
            {/* Mobile bottom nav */}
            < MobileBottomNav />
        </div >
    );
}
