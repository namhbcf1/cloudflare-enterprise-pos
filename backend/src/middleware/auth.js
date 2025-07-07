/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================================
 * Handles JWT token validation and user authentication
 */

import jwt from 'jsonwebtoken';
import { DatabaseService } from '../utils/database.js';
import { KVCacheService } from '../utils/kvStore.js';

/**
 * Authentication middleware
 * Validates JWT tokens and sets user context
 */
export async function authMiddleware(c, next) {
  try {
    // Get token from header
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      }, 401);
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return c.json({
        error: 'Unauthorized',
        message: 'No token provided'
      }, 401);
    }
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, c.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      let message = 'Invalid token';
      if (jwtError.name === 'TokenExpiredError') {
        message = 'Token has expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Malformed token';
      }
      
      return c.json({
        error: 'Unauthorized',
        message
      }, 401);
    }
    
    // Check if token is blacklisted
    const cache = new KVCacheService(c.env);
    const isBlacklisted = await cache.get(`blacklist:${token}`);
    
    if (isBlacklisted) {
      return c.json({
        error: 'Unauthorized',
        message: 'Token has been revoked'
      }, 401);
    }
    
    // Get user from database
    const db = new DatabaseService(c.env.DB);
    const userResult = await db.execute({
      sql: `
        SELECT 
          id, email, first_name, last_name, role, is_active, 
          permissions, last_login, failed_login_attempts, 
          locked_until, created_at, avatar_url, department,
          total_points, current_level, total_sales, total_orders
        FROM users 
        WHERE id = ? AND deleted_at IS NULL
      `,
      args: [decoded.userId]
    });
    
    if (!userResult.results || userResult.results.length === 0) {
      return c.json({
        error: 'Unauthorized',
        message: 'User not found'
      }, 401);
    }
    
    const user = userResult.results[0];
    
    // Check if user is active
    if (!user.is_active) {
      return c.json({
        error: 'Unauthorized',
        message: 'Account has been deactivated'
      }, 401);
    }
    
    // Check if user is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const unlockTime = new Date(user.locked_until).toISOString();
      return c.json({
        error: 'Unauthorized',
        message: 'Account is temporarily locked',
        unlock_time: unlockTime
      }, 401);
    }
    
    // Parse permissions
    let permissions = [];
    try {
      permissions = user.permissions ? JSON.parse(user.permissions) : [];
    } catch (e) {
      console.error('Error parsing user permissions:', e);
      permissions = [];
    }
    
    // Create user object for context
    const userContext = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: `${user.first_name} ${user.last_name}`,
      role: user.role,
      isActive: user.is_active,
      permissions,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      avatarUrl: user.avatar_url,
      department: user.department,
      
      // Gamification data
      totalPoints: user.total_points || 0,
      currentLevel: user.current_level || 1,
      totalSales: user.total_sales || 0,
      totalOrders: user.total_orders || 0,
      
      // Token data
      tokenIat: decoded.iat,
      tokenExp: decoded.exp
    };
    
    // Update last activity in cache (don't wait for it)
    updateUserActivity(cache, user.id).catch(console.error);
    
    // Set user in context
    c.set('user', userContext);
    c.set('token', token);
    c.set('tokenDecoded', decoded);
    
    // Add user info to response headers for debugging
    if (c.env.ENVIRONMENT === 'development') {
      c.header('X-User-ID', user.id.toString());
      c.header('X-User-Role', user.role);
    }
    
    await next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    return c.json({
      error: 'Internal Server Error',
      message: 'Authentication check failed'
    }, 500);
  }
}

/**
 * Optional authentication middleware
 * Sets user context if token is valid, but doesn't fail if missing
 */
export async function optionalAuthMiddleware(c, next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Try to authenticate, but don't fail if it doesn't work
      try {
        await authMiddleware(c, () => Promise.resolve());
      } catch (error) {
        console.error('Optional auth failed:', error);
        // Continue without authentication
      }
    }
    
    await next();
    
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    await next();
  }
}

/**
 * API Key authentication middleware
 * For integrations and third-party access
 */
export async function apiKeyMiddleware(c, next) {
  try {
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey) {
      return c.json({
        error: 'Unauthorized',
        message: 'API key required'
      }, 401);
    }
    
    // Validate API key in database
    const db = new DatabaseService(c.env.DB);
    const apiKeyResult = await db.execute({
      sql: `
        SELECT ak.*, u.id as user_id, u.email, u.role, u.is_active
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        WHERE ak.key_hash = ? 
        AND ak.is_active = TRUE 
        AND ak.deleted_at IS NULL
        AND u.is_active = TRUE 
        AND u.deleted_at IS NULL
        AND (ak.expires_at IS NULL OR ak.expires_at > datetime('now'))
      `,
      args: [await hashApiKey(apiKey)]
    });
    
    if (!apiKeyResult.results || apiKeyResult.results.length === 0) {
      return c.json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      }, 401);
    }
    
    const keyData = apiKeyResult.results[0];
    
    // Update last used timestamp
    updateApiKeyUsage(db, keyData.id).catch(console.error);
    
    // Set API key context
    c.set('apiKey', {
      id: keyData.id,
      name: keyData.name,
      permissions: JSON.parse(keyData.permissions || '[]'),
      lastUsed: keyData.last_used_at
    });
    
    // Set user context from API key owner
    c.set('user', {
      id: keyData.user_id,
      email: keyData.email,
      role: keyData.role,
      isActive: keyData.is_active,
      isApiAccess: true
    });
    
    await next();
    
  } catch (error) {
    console.error('API key middleware error:', error);
    
    return c.json({
      error: 'Internal Server Error',
      message: 'API key validation failed'
    }, 500);
  }
}

/**
 * Update user last activity in cache
 */
async function updateUserActivity(cache, userId) {
  try {
    const activityKey = `user_activity:${userId}`;
    const timestamp = new Date().toISOString();
    
    await cache.set(activityKey, {
      lastSeen: timestamp,
      updatedAt: timestamp
    }, 86400); // 24 hours TTL
    
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
}

/**
 * Update API key usage statistics
 */
async function updateApiKeyUsage(db, apiKeyId) {
  try {
    await db.execute({
      sql: `
        UPDATE api_keys 
        SET last_used_at = datetime('now'),
            usage_count = usage_count + 1
        WHERE id = ?
      `,
      args: [apiKeyId]
    });
    
  } catch (error) {
    console.error('Error updating API key usage:', error);
  }
}

/**
 * Hash API key for secure storage
 */
async function hashApiKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate secure API key
 */
export function generateApiKey() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Blacklist token (for logout)
 */
export async function blacklistToken(cache, token, expirationTime) {
  try {
    const expiresAt = new Date(expirationTime * 1000);
    const ttl = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    
    if (ttl > 0) {
      await cache.set(`blacklist:${token}`, true, ttl);
    }
    
  } catch (error) {
    console.error('Error blacklisting token:', error);
  }
}

/**
 * Get user permissions helper
 */
export function getUserPermissions(user) {
  const rolePermissions = {
    admin: [
      'users.read', 'users.write', 'users.delete',
      'products.read', 'products.write', 'products.delete',
      'orders.read', 'orders.write', 'orders.delete',
      'customers.read', 'customers.write', 'customers.delete',
      'inventory.read', 'inventory.write', 'inventory.delete',
      'reports.read', 'reports.write',
      'analytics.read', 'analytics.write',
      'settings.read', 'settings.write',
      'integrations.read', 'integrations.write'
    ],
    cashier: [
      'pos.read', 'pos.write',
      'orders.read', 'orders.write',
      'customers.read', 'customers.write',
      'products.read',
      'inventory.read'
    ],
    staff: [
      'pos.read',
      'orders.read',
      'customers.read',
      'products.read',
      'gamification.read', 'gamification.write',
      'performance.read'
    ]
  };
  
  const basePermissions = rolePermissions[user.role] || [];
  const customPermissions = user.permissions || [];
  
  return [...new Set([...basePermissions, ...customPermissions])];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user, permission) {
  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permission) || userPermissions.includes('*');
}