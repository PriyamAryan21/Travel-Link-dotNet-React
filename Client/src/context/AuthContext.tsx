import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import authService from '../services/authService';
import { setToken, clearToken, getToken } from '../services/api';
import type { LoginDto, RegisterDto } from '../types';

interface AuthUser {
    userId: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (dto: LoginDto) => Promise<void>;
    register: (dto: RegisterDto) => Promise<void>;
    logout: () => void;
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
                setUser(JSON.parse(stored));
            }
            catch {
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
            email: res.email
        };
        localStorage.setItem('tl_user', JSON.stringify(authUser));
        setUser(authUser);
        toast.success(`Welcome back, ${res.name}!`);
    }, []);

    const register = useCallback(async (dto: RegisterDto) => {
        const res = await authService.register(dto);
        setToken(res.token, res.refreshToken);
        const authUser: AuthUser = {
            userId: res.userId,
            name: res.name,
            email: res.email
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

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout
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