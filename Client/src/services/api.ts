import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ServiceResult, AuthResponseDto, RefreshTokenRequestDto } from "../types";
import { toast } from "sonner";
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
});


const TOKEN_KEY = 'tl_token';
const REFRESH_KEY = 'tl_refresh';

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_KEY);
}

export const setToken = (token: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
}

export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
};


api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token!);
    });
    failedQueue = [];
};

api.interceptors.response.use((response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth')) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        }, reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const token = getToken();
                const refreshToken = getRefreshToken();

                if (!token || !refreshToken) {
                    throw new Error('No tokens available');
                }

                const payLoad: RefreshTokenRequestDto = { token, refreshToken };
                const { data } = await axios.post<ServiceResult<AuthResponseDto>>(
                    '/api/auth/refresh',
                    payLoad
                );

                if (data.success && data.data) {
                    setToken(data.data.token, data.data.refreshToken);
                    processQueue(null, data.data.token);
                    originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
                    return api(originalRequest);
                } else {
                    throw new Error(data.message || 'Refresh failed');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearToken();
                window.dispatchEvent(new Event('auth_logout'));
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export async function unwrap<T>(request: Promise<{ data: ServiceResult<T> }>): Promise<T> {
    try {
        const { data: result } = await request;

        // Handles 2xx responses where backend returned success: false
        if (!result.success) {
            toast.error(result.message || 'Request failed');
            throw new Error(result.message || 'Request failed');
        }
        return result.data as T;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 429) {
                const msg = typeof error.response.data === 'string'
                    ? error.response.data
                    : 'Rate limit exceeded. Please try again later.';
                toast.error(msg, { duration: 6000 });
            } else {
                // Standard fallback
                const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
                toast.error(msg);
            }
        }
        throw error;
    }

}



export default api;


