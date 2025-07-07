/**
 * Authentication Context for React Application
 * Manages user authentication state, token storage, and auth operations
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { message } from 'antd';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-api.your-subdomain.workers.dev';

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    CASHIER: 'cashier',
    STAFF: 'staff'
};

// Role Hierarchy
const ROLE_HIERARCHY = {
    [USER_ROLES.ADMIN]: 4,
    [USER_ROLES.MANAGER]: 3,
    [USER_ROLES.CASHIER]: 2,
    [USER_ROLES.STAFF]: 1
};

// Initial state
const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    tokens: {
        accessToken: null,
        refreshToken: null,
        expiresIn: null
    },
    sessionId: null,
    lastActivity: Date.now(),
    error: null
};

// Action types
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
    UPDATE_USER: 'UPDATE_USER',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    UPDATE_TOKENS: 'UPDATE_TOKENS',
    UPDATE_ACTIVITY: 'UPDATE_ACTIVITY'
};

// Auth reducer
function authReducer(state, action) {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload
            };
            
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                tokens: action.payload.tokens,
                sessionId: action.payload.sessionId,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now(),
                error: null
            };
            
        case AUTH_ACTIONS.LOGOUT:
            return {
                ...initialState,
                isLoading: false
            };
            
        case AUTH_ACTIONS.UPDATE_USER:
            return {
                ...state,
                user: { ...state.user, ...action.payload }
            };
            
        case AUTH_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false
            };
            
        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };
            
        case AUTH_ACTIONS.UPDATE_TOKENS:
            return {
                ...state,
                tokens: action.payload,
                lastActivity: Date.now()
            };
            
        case AUTH_ACTIONS.UPDATE_ACTIVITY:
            return {
                ...state,
                lastActivity: Date.now()
            };
            
        default:
            return state;
    }
}

// Create context
const AuthContext = createContext();

// Token storage utilities
const TokenStorage = {
    setTokens: (tokens, sessionId) => {
        try {
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            localStorage.setItem('sessionId', sessionId);
            localStorage.setItem('tokenExpiry', Date.now() + (tokens.expiresIn * 1000));
        } catch (error) {
            console.error('Error storing tokens:', error);
        }
    },
    
    getTokens: () => {
        try {
            return {
                accessToken: localStorage.getItem('accessToken'),
                refreshToken: localStorage.getItem('refreshToken'),
                sessionId: localStorage.getItem('sessionId'),
                tokenExpiry: localStorage.getItem('tokenExpiry')
            };
        } catch (error) {
            console.error('Error retrieving tokens:', error);
            return {};
        }
    },
    
    clearTokens: () => {
        try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('tokenExpiry');
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    },
    
    isTokenExpired: () => {
        try {
            const expiry = localStorage.getItem('tokenExpiry');
            if (!expiry) return true;
            return Date.now() > parseInt(expiry);
        } catch (error) {
            return true;
        }
    }
};

// API utilities
const API = {
    request: async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },
    
    authenticatedRequest: async (endpoint, options = {}) => {
        const { accessToken } = TokenStorage.getTokens();
        
        return API.request(endpoint, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`
            }
        });
    }
};

// Auth Provider Component
export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    
    // Auto-refresh token before expiry
    useEffect(() => {
        if (state.isAuthenticated && !TokenStorage.isTokenExpired()) {
            const { tokenExpiry } = TokenStorage.getTokens();
            const timeUntilExpiry = parseInt(tokenExpiry) - Date.now();
            const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60000); // Refresh 5 minutes before expiry
            
            const timer = setTimeout(() => {
                refreshTokens();
            }, refreshTime);
            
            return () => clearTimeout(timer);
        }
    }, [state.tokens.accessToken]);
    
    // Activity tracking
    useEffect(() => {
        const handleActivity = () => {
            if (state.isAuthenticated) {
                dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
            }
        };
        
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });
        
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
        };
    }, [state.isAuthenticated]);
    
    // Initialize auth state on app load
    useEffect(() => {
        initializeAuth();
    }, []);
    
    const initializeAuth = useCallback(async () => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        try {
            const tokens = TokenStorage.getTokens();
            
            if (tokens.accessToken && !TokenStorage.isTokenExpired()) {
                // Try to get current user
                const response = await API.authenticatedRequest('/auth/me');
                
                if (response.success) {
                    dispatch({
                        type: AUTH_ACTIONS.LOGIN_SUCCESS,
                        payload: {
                            user: response.data.user,
                            tokens: {
                                accessToken: tokens.accessToken,
                                refreshToken: tokens.refreshToken,
                                expiresIn: Math.floor((parseInt(tokens.tokenExpiry) - Date.now()) / 1000)
                            },
                            sessionId: tokens.sessionId
                        }
                    });
                } else {
                    // Token is invalid, try to refresh
                    await refreshTokens();
                }
            } else if (tokens.refreshToken) {
                // Access token expired, try to refresh
                await refreshTokens();
            } else {
                // No valid tokens
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            logout();
        }
    }, []);
    
    const login = useCallback(async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        try {
            const deviceInfo = `${navigator.userAgent} - ${window.screen.width}x${window.screen.height}`;
            
            const response = await API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    ...credentials,
                    deviceInfo
                })
            });
            
            if (response.success) {
                const { user, tokens, sessionId } = response.data;
                
                // Store tokens
                TokenStorage.setTokens(tokens, sessionId);
                
                // Update state
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: { user, tokens, sessionId }
                });
                
                message.success('Đăng nhập thành công!');
                return { success: true };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const errorMessage = error.message || 'Đăng nhập thất bại';
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);
    
    const logout = useCallback(async () => {
        try {
            // Call logout API
            if (state.isAuthenticated) {
                await API.authenticatedRequest('/auth/logout', {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear tokens and state regardless of API result
            TokenStorage.clearTokens();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
            message.info('Đã đăng xuất');
        }
    }, [state.isAuthenticated]);
    
    const refreshTokens = useCallback(async () => {
        try {
            const { refreshToken } = TokenStorage.getTokens();
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await API.request('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ refreshToken })
            });
            
            if (response.success) {
                const { accessToken, expiresIn } = response.data;
                const newTokens = {
                    accessToken,
                    refreshToken, // Keep existing refresh token
                    expiresIn
                };
                
                // Update stored tokens
                TokenStorage.setTokens(newTokens, state.sessionId);
                
                // Update state
                dispatch({
                    type: AUTH_ACTIONS.UPDATE_TOKENS,
                    payload: newTokens
                });
                
                return true;
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            return false;
        }
    }, [state.sessionId]);
    
    const register = useCallback(async (userData) => {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        
        try {
            const response = await API.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (response.success) {
                message.success('Đăng ký thành công! Vui lòng đăng nhập.');
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
                return { success: true };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const errorMessage = error.message || 'Đăng ký thất bại';
            dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);
    
    const updateUser = useCallback(async (updates) => {
        try {
            // Update local state immediately for better UX
            dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updates });
            
            // TODO: API call to update user on server
            // const response = await API.authenticatedRequest('/auth/update-profile', {
            //     method: 'PUT',
            //     body: JSON.stringify(updates)
            // });
            
            message.success('Thông tin đã được cập nhật');
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || 'Cập nhật thất bại';
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);
    
    const changePassword = useCallback(async (passwordData) => {
        try {
            const response = await API.authenticatedRequest('/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify(passwordData)
            });
            
            if (response.success) {
                message.success('Mật khẩu đã được thay đổi thành công');
                return { success: true };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const errorMessage = error.message || 'Thay đổi mật khẩu thất bại';
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);
    
    const forgotPassword = useCallback(async (email) => {
        try {
            const response = await API.request('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            
            if (response.success) {
                message.success('Liên kết đặt lại mật khẩu đã được gửi đến email của bạn');
                return { success: true };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const errorMessage = error.message || 'Gửi email thất bại';
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);
    
    const resetPassword = useCallback(async (token, newPassword) => {
        try {
            const response = await API.request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword })
            });
            
            if (response.success) {
                message.success('Mật khẩu đã được đặt lại thành công');
                return { success: true };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const errorMessage = error.message || 'Đặt lại mật khẩu thất bại';
            message.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);
    
    const hasRole = useCallback((requiredRole) => {
        if (!state.user) return false;
        const userLevel = ROLE_HIERARCHY[state.user.role] || 0;
        const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
        return userLevel >= requiredLevel;
    }, [state.user]);
    
    const hasPermission = useCallback((permission) => {
        if (!state.user) return false;
        
        // Define role-based permissions
        const permissions = {
            [USER_ROLES.ADMIN]: ['all'],
            [USER_ROLES.MANAGER]: ['view_reports', 'manage_inventory', 'manage_staff', 'process_transactions'],
            [USER_ROLES.CASHIER]: ['process_transactions', 'view_inventory'],
            [USER_ROLES.STAFF]: ['view_inventory']
        };
        
        const userPermissions = permissions[state.user.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }, [state.user]);
    
    const clearError = useCallback(() => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }, []);
    
    // Context value
    const value = {
        // State
        ...state,
        
        // Actions
        login,
        logout,
        register,
        updateUser,
        changePassword,
        forgotPassword,
        resetPassword,
        refreshTokens,
        clearError,
        
        // Utilities
        hasRole,
        hasPermission,
        isTokenExpired: TokenStorage.isTokenExpired
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// HOC for protected components
export function withAuth(Component, requiredRole = null) {
    return function AuthenticatedComponent(props) {
        const { isAuthenticated, isLoading, hasRole } = useAuth();
        
        if (isLoading) {
            return <div>Loading...</div>; // Replace with proper loading component
        }
        
        if (!isAuthenticated) {
            return <div>Please login to access this page</div>; // Replace with login redirect
        }
        
        if (requiredRole && !hasRole(requiredRole)) {
            return <div>Access denied. Insufficient permissions.</div>; // Replace with proper error component
        }
        
        return <Component {...props} />;
    };
}

export default AuthContext;