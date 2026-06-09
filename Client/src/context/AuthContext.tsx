import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import authService from '../services/authService';
import { setToken, clearToken, getToken } from '../services/api';
import type { LoginDto, RegisterDto } from '../types';
import userService from '../services/userService';

interface AuthUser {
    userId: string;
    name: string;
    email: string;
    imageUrl?: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (dto: LoginDto) => Promise<void>;
    register: (dto: RegisterDto) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        const stored = localStorage.getItem('tl_user');
        if (token && stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                // Fetch fresh profile to get imageUrl
                userService.getProfile().then((profile) => {
                    const updated = { ...parsed, imageUrl: profile.imageUrl };
                    setUser(updated);
                    localStorage.setItem('tl_user', JSON.stringify(updated));
                }).catch(() => { /* silently fail — user still has basic data */ });
            } catch {
                clearToken();
                localStorage.removeItem('tl_user');
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handleForceLogout = () => {
            setUser(null);
            localStorage.removeItem('tl_user');
            toast.error('Session expired. Please log in again.');
        };
        window.addEventListener('auth_logout', handleForceLogout);
        return () => window.removeEventListener('auth_logout', handleForceLogout);
    }, []);

    const login = useCallback(async (dto: LoginDto) => {
        const res = await authService.login(dto);
        setToken(res.token, res.refreshToken);
        const authUser: AuthUser = {
            userId: res.userId,
            name: res.name,
            email: res.email,
            imageUrl: res.imageUrl ?? null
        };
        localStorage.setItem('tl_user', JSON.stringify(authUser));
        setUser(authUser);
        userService.getProfile().then((profile) => {
            const updated = { ...authUser, imageUrl: profile.imageUrl };
            setUser(updated);
            localStorage.setItem('tl_user', JSON.stringify(updated));
        }).catch(() => { });
        toast.success(`Welcome back, ${res.name}!`);
    }, []);

    const register = useCallback(async (dto: RegisterDto) => {
        const res = await authService.register(dto);
        setToken(res.token, res.refreshToken);
        const authUser: AuthUser = {
            userId: res.userId,
            name: res.name,
            email: res.email,
            imageUrl: res.imageUrl ?? null
        };
        localStorage.setItem('tl_user', JSON.stringify(authUser));
        setUser(authUser);
        toast.success(`Welcome ${res.name}!`);
    }, []);

    const logout = useCallback(() => {
        clearToken();
        localStorage.removeItem('tl_user');
        setUser(null);
        toast.success('Logged out successfully.');
    }, [])

    const updateUser = useCallback((updates: Partial<AuthUser>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates };
            localStorage.setItem('tl_user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used with AuthProvider');
    }
    return ctx;
}