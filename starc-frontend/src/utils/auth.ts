import axios, { AxiosInstance } from 'axios';
import { useRouter } from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';

export interface TokenPair {
    access_token: string;
    refresh_token?: string;
}

// Create a custom axios instance
export const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const storeTokens = (tokens: TokenPair) => {
    localStorage.setItem('authToken', tokens.access_token);
    if (tokens.refresh_token) {
        localStorage.setItem('refreshToken', tokens.refresh_token);
    }
    // Update axios default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
};

export const getStoredTokens = (): TokenPair => {
    return {
        access_token: localStorage.getItem('authToken') || '',
        refresh_token: localStorage.getItem('refreshToken') || '',
    };
};

export const clearTokens = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
};

// Initialize auth header if token exists
const tokens = getStoredTokens();
if (tokens.access_token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
}

export const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
        const response = await axios.post<TokenPair>(
            `${API_URL}/auth/refresh`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            }
        );

        const newAccessToken = response.data.access_token;
        if (newAccessToken) {
            localStorage.setItem('authToken', newAccessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            return newAccessToken;
        }
        return null;
    } catch (error) {
        clearTokens();
        return null;
    }
};

// Add request interceptor to add auth header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const newToken = await refreshAccessToken();
            if (newToken) {
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } else {
                // If refresh failed, redirect to login
                clearTokens();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
); 