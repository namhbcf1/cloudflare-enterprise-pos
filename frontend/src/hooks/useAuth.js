import { useContext, useCallback, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { USER_ROLES, ROLE_PERMISSIONS } from '../utils/constants';
import { showErrorNotification, showSuccessNotification } from '../utils/helpers';

/**
 * Custom hook for authentication management
 * Provides authentication state, user management, and permission checking
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    refreshToken,
    setUser,
    setToken,
    clearAuth
  } = context;

  // Permission checking utilities
  const hasPermission = useCallback((permission) => {
    if (!user || !user.role) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Role checking utilities
  const hasRole = useCallback((role) => {
    if (!user || !user.role) return false;
    return user.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    if (!Array.isArray(roles) || !user || !user.role) return false;
    return roles.includes(user.role);
  }, [user]);

  const isAdmin = useCallback(() => {
    return hasRole(USER_ROLES.ADMIN);
  }, [hasRole]);

  const isManager = useCallback(() => {
    return hasRole(USER_ROLES.MANAGER);
  }, [hasRole]);

  const isCashier = useCallback(() => {
    return hasRole(USER_ROLES.CASHIER);
  }, [hasRole]);

  const isStaff = useCallback(() => {
    return hasRole(USER_ROLES.STAFF);
  }, [hasRole]);

  const isManagerOrAbove = useCallback(() => {
    return hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER]);
  }, [hasAnyRole]);

  const isCashierOrAbove = useCallback(() => {
    return hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER]);
  }, [hasAnyRole]);

  // Enhanced login with error handling
  const loginWithNotification = useCallback(async (email, password, remember = false) => {
    try {
      const result = await login(email, password, remember);
      showSuccessNotification(
        'Login Successful',
        `Welcome back, ${result.user?.name || email}!`
      );
      return result;
    } catch (error) {
      showErrorNotification(
        'Login Failed',
        error.message || 'Please check your credentials and try again.'
      );
      throw error;
    }
  }, [login]);

  // Enhanced logout with cleanup
  const logoutWithNotification = useCallback(async () => {
    try {
      await logout();
      showSuccessNotification(
        'Logged Out',
        'You have been successfully logged out.'
      );
    } catch (error) {
      showErrorNotification(
        'Logout Error',
        'There was an issue logging you out. Please try again.'
      );
      // Force logout on error
      clearAuth();
    }
  }, [logout, clearAuth]);

  // Enhanced profile update
  const updateProfileWithNotification = useCallback(async (profileData) => {
    try {
      const result = await updateProfile(profileData);
      showSuccessNotification(
        'Profile Updated',
        'Your profile has been successfully updated.'
      );
      return result;
    } catch (error) {
      showErrorNotification(
        'Update Failed',
        error.message || 'Failed to update profile. Please try again.'
      );
      throw error;
    }
  }, [updateProfile]);

  // Enhanced registration
  const registerWithNotification = useCallback(async (userData) => {
    try {
      const result = await register(userData);
      showSuccessNotification(
        'Registration Successful',
        'Your account has been created successfully!'
      );
      return result;
    } catch (error) {
      showErrorNotification(
        'Registration Failed',
        error.message || 'Failed to create account. Please try again.'
      );
      throw error;
    }
  }, [register]);

  // Token validation and refresh
  const validateToken = useCallback(async () => {
    if (!token) return false;
    
    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        // Token is expired, try to refresh
        if (refreshToken) {
          await refreshToken();
          return true;
        } else {
          await logout();
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      await logout();
      return false;
    }
  }, [token, refreshToken, logout]);

  // Get user display name
  const getUserDisplayName = useCallback(() => {
    if (!user) return '';
    return user.name || user.email || 'User';
  }, [user]);

  // Get user avatar/initials
  const getUserInitials = useCallback(() => {
    if (!user) return '';
    
    if (user.name) {
      return user.name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  }, [user]);

  // Check if user can access specific features
  const canAccessPOS = useCallback(() => {
    return hasPermission('pos.access');
  }, [hasPermission]);

  const canManageProducts = useCallback(() => {
    return hasPermission('products.create') || hasPermission('products.update');
  }, [hasPermission]);

  const canViewAnalytics = useCallback(() => {
    return hasPermission('analytics.view');
  }, [hasPermission]);

  const canManageStaff = useCallback(() => {
    return hasPermission('staff.create') || hasPermission('staff.update');
  }, [hasPermission]);

  const canAccessSettings = useCallback(() => {
    return hasPermission('settings.manage');
  }, [hasPermission]);

  // Session management
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }

    // Set session timeout (30 minutes of inactivity)
    const timeout = setTimeout(() => {
      setSessionWarning(true);
      
      // Auto logout after 5 minutes of warning
      setTimeout(() => {
        logoutWithNotification();
      }, 5 * 60 * 1000);
    }, 30 * 60 * 1000);

    setSessionTimeout(timeout);
  }, [sessionTimeout, logoutWithNotification]);

  const extendSession = useCallback(() => {
    setSessionWarning(false);
    resetSessionTimeout();
  }, [resetSessionTimeout]);

  // Activity tracking for session management
  useEffect(() => {
    if (isAuthenticated) {
      resetSessionTimeout();

      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const resetTimer = () => {
        if (!sessionWarning) {
          resetSessionTimeout();
        }
      };

      activityEvents.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });

      return () => {
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
        }
        activityEvents.forEach(event => {
          document.removeEventListener(event, resetTimer, true);
        });
      };
    }
  }, [isAuthenticated, sessionWarning, resetSessionTimeout, sessionTimeout]);

  // Return enhanced auth object
  return {
    // Core auth state
    user,
    token,
    isAuthenticated,
    isLoading,

    // Core auth methods
    login: loginWithNotification,
    logout: logoutWithNotification,
    register: registerWithNotification,
    updateProfile: updateProfileWithNotification,
    refreshToken,
    validateToken,

    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Role checking
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isCashier,
    isStaff,
    isManagerOrAbove,
    isCashierOrAbove,

    // Feature access checking
    canAccessPOS,
    canManageProducts,
    canViewAnalytics,
    canManageStaff,
    canAccessSettings,

    // User utilities
    getUserDisplayName,
    getUserInitials,

    // Session management
    sessionWarning,
    extendSession,

    // Advanced methods
    setUser,
    setToken,
    clearAuth,
  };
};

// Helper hook for requiring authentication
export const useRequireAuth = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [isAuthenticated, isLoading]);

  return {
    isAuthenticated,
    isLoading,
    shouldRedirect,
    redirectTo
  };
};

// Helper hook for requiring specific permissions
export const useRequirePermission = (permission, fallback = null) => {
  const { hasPermission, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasAccess(hasPermission(permission));
    }
  }, [hasPermission, permission, isLoading]);

  return {
    hasAccess,
    isLoading,
    fallback
  };
};

// Helper hook for requiring specific roles
export const useRequireRole = (roles, fallback = null) => {
  const { hasAnyRole, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      setHasAccess(hasAnyRole(roleArray));
    }
  }, [hasAnyRole, roles, isLoading]);

  return {
    hasAccess,
    isLoading,
    fallback
  };
};

export default useAuth;

/*
📁 FILE PATH: frontend/src/hooks/useAuth.js

📋 DESCRIPTION:
Comprehensive authentication hook providing user management, permission checking,
role validation, and session management for the Enterprise POS system.

🔧 FEATURES:
- Authentication state management with notifications
- Permission-based access control (RBAC)
- Role checking utilities for UI conditionals
- Session management with automatic timeout
- Token validation and refresh handling
- Feature-specific access checking
- User profile management with error handling
- Activity-based session extension
- Helper hooks for route/component protection

🎯 USAGE:
const { user, isAuthenticated, hasPermission, canAccessPOS } = useAuth();
const { hasAccess } = useRequirePermission('products.create');
const { shouldRedirect } = useRequireAuth('/login');

⚡ EXAMPLES:
- hasPermission('products.create') → true/false
- isManagerOrAbove() → true for admin/manager roles
- canAccessPOS() → checks pos.access permission
- getUserDisplayName() → returns user's display name
- sessionWarning → shows session timeout warning
*/