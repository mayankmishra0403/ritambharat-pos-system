import axios from 'axios';
import toast from 'react-hot-toast';

// Use environment variable for API base URL
// Production fallback to api.ritambharat.software (Vercel can't proxy /api)
const API_BASE_URL = import.meta.env.VITE_API_URL
    || (import.meta.env.PROD ? 'https://api.ritambharat.software/api' : '/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


// Request interceptor - Add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
    (response) => {
        // Validate response structure
        if (!response || !response.data) {
            console.error('Invalid response structure:', response);
            return Promise.reject(new Error('Empty response from server'));
        }

        // Detect if we received HTML instead of JSON (common in misconfigured production SPA proxies)
        if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
            console.error('API returned HTML (likely SPA catch-all). Check VITE_API_URL.', {
                url: response.config.url,
                baseUrl: API_BASE_URL
            });
            return Promise.reject(new Error('Backend unreachable — check API URL configuration'));
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    if (!response?.data?.data) {
                        throw new Error('Invalid token refresh response');
                    }

                    const { token, refreshToken: newRefreshToken } = response.data.data;
                    localStorage.setItem('token', token);
                    if (newRefreshToken) {
                        localStorage.setItem('refreshToken', newRefreshToken);
                    }

                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        if (!error.config?._skipErrorToast) {
            // Skip toast for cancelled/aborted requests (React Query cancels on retry/remount)
            if (error.code === 'ERR_CANCELED' || axios.isCancel(error)) {
                return Promise.reject(error);
            }
            const errorMsg = error.response?.data?.message || error.message || 'An error occurred';
            console.error('API Error:', error.response?.status, errorMsg);
            if (errorMsg !== 'undefined') {
                toast.error(errorMsg);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
export { API_BASE_URL };
