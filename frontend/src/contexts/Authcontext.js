import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { message } from 'antd'
import apiClient from '../services/api'

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Initial auth state
const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  refreshToken: null,
  permissions: [],
  roleLevel: 0,
  error: null,
  lastActivity: null
}

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        permissions: action.payload.permissions || [],
        roleLevel: action.payload.roleLevel || 0,
        error: null,
        lastActivity: Date.now()
      }
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        permissions: [],
        roleLevel: 0,
        error: action.payload.error
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      }
    
    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        lastActivity: Date.now()
      }
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Role permissions mapping (should match backend)
const ROLE_PERMISSIONS = {
  admin: {
    level: 3,
    permissions: [
      'users:manage', 'products:manage', 'orders:manage', 'customers:manage',
      'staff:manage', 'analytics:view', 'settings:manage', 'reports:generate'
    ]
  },
  staff: {
    level: 2,
    permissions: [
      'products:manage', 'orders:view', 'customers:manage', 
      'analytics:view', 'inventory:manage'
    ]
  },
  cashier: {
    level: 1,
    permissions: [
      'products:view', 'orders:create', 'customers:view', 'pos:operate'
    ]
  }
}

// Create auth context
const AuthContext = createContext(null)

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Storage keys
  const STORAGE_KEYS = {
    ACCESS_TOKEN: 'pos_access_token',
    REFRESH_TOKEN: 'pos_refresh_token',
    USER: 'pos_user',
    LAST_ACTIVITY: 'pos_last_activity'
  }

  // Save auth data to storage
  const saveAuthData = (authData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user))
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString())
    } catch (error) {
      console.error('Failed to save auth data:', error)
    }
  }

  // Clear auth data from storage
  const clearAuthData = () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Failed to clear auth data:', error)
    }
  }

  // Load auth data from storage
  const loadAuthData = () => {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const userStr = localStorage.getItem(STORAGE_KEYS.USER)
      const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY)

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr)
        const roleData = ROLE_PERMISSIONS[user.role] || { level: 0, permissions: [] }
        
        return {
          accessToken,
          refreshToken,
          user,
          permissions: roleData.permissions,
          roleLevel: roleData.level,
          lastActivity: lastActivity ? parseInt(lastActivity) : null
        }
      }
    } catch (error) {
      console.error('Failed to load auth data:', error)
      clearAuthData()
    }
    return null
  }

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })

    try {
      const response = await apiClient.post('/auth/login', credentials)
      const { user, accessToken, refreshToken } = response.data

      const roleData = ROLE_PERMISSIONS[user.role] || { level: 0, permissions: [] }
      
      const authData = {
        user,
        accessToken,
        refreshToken,
        permissions: roleData.permissions,
        roleLevel: roleData.level
      }

      // Save to storage
      saveAuthData(authData)

      // Update API client default headers
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: authData
      })

      message.success(`Welcome back, ${user.name}!`)
      return { success: true }

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed'
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      })

      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Logout function
  const logout = async (showMessage = true) => {
    try {
      // Call logout endpoint
      if (state.accessToken) {
        await apiClient.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear storage and state regardless of API call result
      clearAuthData()
      delete apiClient.defaults.headers.common['Authorization']
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      
      if (showMessage) {
        message.success('Logged out successfully')
      }
    }
  }

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshTokenValue = state.refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available')
      }

      const response = await apiClient.post('/auth/refresh', {
        refreshToken: refreshTokenValue
      })

      const { accessToken, refreshToken: newRefreshToken } = response.data

      // Update storage
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString())

      // Update API client headers
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: {
          accessToken,
          refreshToken: newRefreshToken
        }
      })

      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout(false)
      return false
    }
  }

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await apiClient.put('/auth/profile', userData)
      const updatedUser = response.data.user

      // Update storage
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser))

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser
      })

      message.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await apiClient.put('/auth/change-password', passwordData)
      message.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to change password'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Check if user has permission
  const hasPermission = (permission) => {
    return state.permissions.includes(permission)
  }

  // Check if user has any of the permissions
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => state.permissions.includes(permission))
  }

  // Check if user has role level
  const hasRoleLevel = (requiredLevel) => {
    return state.roleLevel >= requiredLevel
  }

  // Check if user can access route
  const canAccessRoute = (routePermissions) => {
    if (!routePermissions || routePermissions.length === 0) return true
    return hasAnyPermission(routePermissions)
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Auto-refresh token setup
  useEffect(() => {
    let refreshInterval

    if (state.isAuthenticated && state.accessToken) {
      // Refresh token every 10 minutes (tokens expire in 15 minutes)
      refreshInterval = setInterval(() => {
        refreshToken()
      }, 10 * 60 * 1000)
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [state.isAuthenticated, state.accessToken])

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => {
      if (state.isAuthenticated) {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString())
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity)
      })
    }
  }, [state.isAuthenticated])

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })

      const savedAuthData = loadAuthData()
      
      if (savedAuthData) {
        // Check if session is still valid (within last 24 hours)
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        const isExpired = savedAuthData.lastActivity && 
          (Date.now() - savedAuthData.lastActivity) > maxAge

        if (isExpired) {
          clearAuthData()
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          return
        }

        // Set API client header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedAuthData.accessToken}`

        // Try to verify token by fetching user info
        try {
          const response = await apiClient.get('/auth/me')
          const user = response.data.user

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              ...savedAuthData,
              user
            }
          })
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshed = await refreshToken()
          if (!refreshed) {
            clearAuthData()
          }
        }
      }

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }

    initializeAuth()
  }, [])

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    refreshToken,
    updateUser,
    changePassword,
    clearError,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasRoleLevel,
    canAccessRoute,
    
    // Utilities
    isAdmin: state.user?.role === 'admin',
    isStaff: ['admin', 'staff'].includes(state.user?.role),
    isCashier: state.user?.role === 'cashier'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext