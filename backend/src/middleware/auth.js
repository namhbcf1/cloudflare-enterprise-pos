/**
 * Authentication Middleware for Cloudflare Workers
 * Handles JWT token validation, user context, and role-based access control
 */

import jwt from '@tsndr/cloudflare-worker-jwt';

// JWT Configuration
const JWT_CONFIG = {
    algorithm: 'HS256',
    expiresIn: '24h',
    refreshExpiresIn: '7d'
};

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager', 
    CASHIER: 'cashier',
    STAFF: 'staff'
};

// Role Hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
    [USER_ROLES.ADMIN]: 4,
    [USER_ROLES.MANAGER]: 3,
    [USER_ROLES.CASHIER]: 2,
    [USER_ROLES.STAFF]: 1
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {Promise<string>} JWT token
 */
export async function generateToken(payload, secret, type = 'access') {
    const expiresIn = type === 'refresh' ? JWT_CONFIG.refreshExpiresIn : JWT_CONFIG.expiresIn;
    const exp = Math.floor(Date.now() / 1000) + (type === 'refresh' ? 7 * 24 * 60 * 60 : 24 * 60 * 60);
    
    const tokenPayload = {
        ...payload,
        type,
        iat: Math.floor(Date.now() / 1000),
        exp
    };
    
    return await jwt.sign(tokenPayload, secret, { algorithm: JWT_CONFIG.algorithm });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {Promise<Object|null>} Decoded payload or null
 */
export async function verifyToken(token, secret) {
    try {
        const isValid = await jwt.verify(token, secret);
        if (!isValid) return null;
        
        const decoded = jwt.decode(token);
        
        // Check if token is expired
        if (decoded.payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        
        return decoded.payload;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

/**
 * Extract token from Authorization header
 * @param {Request} request - HTTP request
 * @returns {string|null} JWT token or null
 */
function extractToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Get user from database by ID
 * @param {string} userId - User ID
 * @param {Object} env - Environment variables
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserFromDB(userId, env) {
    try {
        const stmt = env.DB.prepare(`
            SELECT 
                u.id,
                u.email,
                u.username,
                u.full_name,
                u.role,
                u.status,
                u.last_login,
                u.created_at,
                s.id as session_id,
                s.expires_at as session_expires
            FROM users u
            LEFT JOIN user_sessions s ON u.id = s.user_id 
                AND s.expires_at > datetime('now')
                AND s.is_active = 1
            WHERE u.id = ? AND u.status = 'active'
        `);
        
        const result = await stmt.bind(userId).first();
        return result;
    } catch (error) {
        console.error('Database error in getUserFromDB:', error);
        return null;
    }
}

/**
 * Update user last activity
 * @param {string} userId - User ID
 * @param {Object} env - Environment variables
 */
async function updateLastActivity(userId, env) {
    try {
        const stmt = env.DB.prepare(`
            UPDATE users 
            SET last_activity = datetime('now')
            WHERE id = ?
        `);
        await stmt.bind(userId).run();
    } catch (error) {
        console.error('Error updating last activity:', error);
    }
}

/**
 * Check if user has required role permission
 * @param {string} userRole - User's role
 * @param {string} requiredRole - Required role
 * @returns {boolean} Has permission
 */
export function hasRolePermission(userRole, requiredRole) {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
}

/**
 * Authentication middleware
 * @param {Request} request - HTTP request
 * @param {Object} env - Environment variables
 * @param {Object} ctx - Execution context
 * @returns {Promise<Object>} Auth result
 */
export async function authenticateRequest(request, env, ctx) {
    const token = extractToken(request);
    
    if (!token) {
        return {
            success: false,
            error: 'No authentication token provided',
            status: 401
        };
    }
    
    // Verify token
    const payload = await verifyToken(token, env.JWT_SECRET);
    if (!payload) {
        return {
            success: false,
            error: 'Invalid or expired token',
            status: 401
        };
    }
    
    // Check token type
    if (payload.type !== 'access') {
        return {
            success: false,
            error: 'Invalid token type',
            status: 401
        };
    }
    
    // Get user from database
    const user = await getUserFromDB(payload.userId, env);
    if (!user) {
        return {
            success: false,
            error: 'User not found or inactive',
            status: 401
        };
    }
    
    // Update last activity (don't await to avoid blocking)
    ctx.waitUntil(updateLastActivity(user.id, env));
    
    return {
        success: true,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.full_name,
            role: user.role,
            status: user.status,
            lastLogin: user.last_login,
            createdAt: user.created_at,
            sessionId: user.session_id
        },
        payload
    };
}

/**
 * Role-based authorization middleware
 * @param {string} requiredRole - Required role
 * @returns {Function} Middleware function
 */
export function requireRole(requiredRole) {
    return async (request, env, ctx) => {
        const auth = await authenticateRequest(request, env, ctx);
        
        if (!auth.success) {
            return auth;
        }
        
        if (!hasRolePermission(auth.user.role, requiredRole)) {
            return {
                success: false,
                error: `Access denied. Required role: ${requiredRole}`,
                status: 403
            };
        }
        
        return auth;
    };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 * @param {Request} request - HTTP request
 * @param {Object} env - Environment variables
 * @param {Object} ctx - Execution context
 * @returns {Promise<Object>} Auth result
 */
export async function optionalAuth(request, env, ctx) {
    const token = extractToken(request);
    
    if (!token) {
        return {
            success: true,
            user: null,
            payload: null
        };
    }
    
    return await authenticateRequest(request, env, ctx);
}

/**
 * Rate limiting by user
 * @param {string} userId - User ID
 * @param {Object} env - Environment variables
 * @param {number} limit - Rate limit per minute
 * @returns {Promise<boolean>} Is within rate limit
 */
export async function checkRateLimit(userId, env, limit = 60) {
    try {
        const key = `rate_limit:${userId}:${Math.floor(Date.now() / 60000)}`;
        const current = await env.RATE_LIMIT_KV.get(key);
        const count = current ? parseInt(current) : 0;
        
        if (count >= limit) {
            return false;
        }
        
        await env.RATE_LIMIT_KV.put(key, (count + 1).toString(), { expirationTtl: 60 });
        return true;
    } catch (error) {
        console.error('Rate limit error:', error);
        return true; // Allow on error
    }
}

/**
 * Create authentication response helper
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response} HTTP response
 */
export function createAuthResponse(success, message, data = null, status = 200) {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString()
    };
    
    if (data) {
        response.data = data;
    }
    
    return new Response(JSON.stringify(response), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        }
    });
}

/**
 * Session management
 */
export class SessionManager {
    constructor(env) {
        this.env = env;
    }
    
    /**
     * Create new session
     * @param {string} userId - User ID
     * @param {string} deviceInfo - Device information
     * @returns {Promise<string>} Session ID
     */
    async createSession(userId, deviceInfo = '') {
        try {
            const sessionId = crypto.randomUUID();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            
            const stmt = this.env.DB.prepare(`
                INSERT INTO user_sessions (id, user_id, device_info, expires_at, created_at, is_active)
                VALUES (?, ?, ?, ?, datetime('now'), 1)
            `);
            
            await stmt.bind(sessionId, userId, deviceInfo, expiresAt.toISOString()).run();
            return sessionId;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }
    
    /**
     * Invalidate session
     * @param {string} sessionId - Session ID
     */
    async invalidateSession(sessionId) {
        try {
            const stmt = this.env.DB.prepare(`
                UPDATE user_sessions 
                SET is_active = 0, invalidated_at = datetime('now')
                WHERE id = ?
            `);
            await stmt.bind(sessionId).run();
        } catch (error) {
            console.error('Error invalidating session:', error);
        }
    }
    
    /**
     * Cleanup expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const stmt = this.env.DB.prepare(`
                UPDATE user_sessions 
                SET is_active = 0, invalidated_at = datetime('now')
                WHERE expires_at < datetime('now') AND is_active = 1
            `);
            await stmt.run();
        } catch (error) {
            console.error('Error cleaning up sessions:', error);
        }
    }
}