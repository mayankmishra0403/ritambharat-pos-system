import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            console.log('[Auth] Initializing...');
            const token = localStorage.getItem('token');
            const savedUserStr = localStorage.getItem('user');

            if (token && savedUserStr) {
                try {
                    const savedUser = JSON.parse(savedUserStr);
                    // Validate savedUser has role and id
                    if (savedUser && (savedUser.role || savedUser._id || savedUser.id)) {
                        console.log('[Auth] Valid saved user found:', savedUser.role);
                        setUser(savedUser);
                        // Always fetch fresh data on reload to ensure state consistency
                        await fetchMe();
                    } else {
                        console.warn('[Auth] Invalid saved user structure, clearing storage');
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                    }
                } catch (e) {
                    console.error('[Auth] Error parsing saved user:', e);
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
            console.log('[Auth] Initialization complete');
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });

            // Safety checks for valid response
            if (!response || !response.data) {
                throw new Error('Invalid response from server. Please check your backend.');
            }

            if (!response.data.data) {
                console.error('API Response:', response.data);
                throw new Error('Server returned invalid data structure');
            }

            const { user, token, refreshToken } = response.data.data;

            if (!user || !token) {
                throw new Error('Missing user or token in response');
            }

            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            return user;
        } catch (error) {
            const errorData = error.response?.data;
            const errorMsg = errorData?.message || error.message || 'Login failed';

            if (errorData?.notVerified) {
                // Return structured error for the UI to handle
                return { notVerified: true, email: email };
            }

            console.error('Login error:', errorMsg);
            toast.error(errorMsg);
            throw error;
        }
    };

    const register = async (name, email, password, role = 'OWNER') => {
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                role,
            });

            // Safety checks for valid response
            if (!response || !response.data) {
                throw new Error('Invalid response from server. Please check your backend.');
            }

            // Verify that the response actually contains a success flag
            if (response.data && response.data.success) {
                return { success: true, message: response.data.message };
            }

            // Fallback if success flag is missing (e.g., getting HTML back from a proxy)
            throw new Error('Server returned an unexpected response format. Please try again.');
        } catch (error) {
            throw error;
        }
    };

    const pinLogin = async (pin, restaurantId) => {
        try {
            const response = await api.post('/auth/pin-login', { pin, restaurantId });

            if (!response?.data?.data) {
                throw new Error('Server returned invalid data structure');
            }

            const { user, token, refreshToken } = response.data.data;

            if (!user || !token) {
                throw new Error('Missing user or token in response');
            }

            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            return user;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'PIN login failed';
            toast.error(errorMsg);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const checkRestaurantStatus = async () => {
        try {
            const response = await api.get('/restaurant/my-primary', { _skipErrorToast: true });
            return response.data.success && response.data.data !== null;
        } catch (error) {
            // 404 means no restaurant found
            if (error.response?.status === 404) {
                return false;
            }
            console.error('Error checking restaurant status:', error);
            return false;
        }
    };

    const fetchMe = async () => {
        try {
            const response = await api.get('/auth/me');
            const updatedUser = response.data.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            // No need to tryRefresh here; the api interceptor already handles it.
            // If it reaches here, both initial request and refresh-retry failed.
            console.error('[Auth] Error fetching user data:', error.message);
            return null;
        }
    };

    const tryRefresh = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;

        try {
            const res = await api.post('/auth/refresh', { refreshToken });
            const { token, refreshToken: newRefreshToken } = res.data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', newRefreshToken);
            return true;
        } catch (err) {
            logout(); // Force logout if refresh fails
            return false;
        }
    };

    const value = useMemo(() => ({
        user,
        loading,
        login,
        pinLogin,
        register,
        logout,
        checkRestaurantStatus,
        fetchMe,
        tryRefresh,
        setUser,
        isAuthenticated: !!user,
    }), [user, loading, login, pinLogin, register, logout, checkRestaurantStatus, fetchMe, tryRefresh, setUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
