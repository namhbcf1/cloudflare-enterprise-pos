import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const auth = new Hono()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'cashier', 'staff']).optional().default('staff'),
  phone: z.string().optional()
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
})

// Helper functions
async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

async function generateTokens(user, env) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  }
  
  const accessToken = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + (15 * 60) }, // 15 minutes
    env.JWT_SECRET
  )
  
  const refreshToken = await sign(
    { ...payload, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) }, // 7 days
    env.JWT_SECRET
  )
  
  return { accessToken, refreshToken }
}

async function logActivity(db, userId, action, details = {}) {
  try {
    await db.prepare(`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_values, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      userId,
      action,
      'auth',
      userId,
      JSON.stringify(details)
    ).run()
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// POST /api/auth/login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = loginSchema.parse(body)
    
    // Find user by email
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, name, role, is_active 
      FROM users 
      WHERE email = ? AND is_active = 1
    `).bind(validatedData.email).first()
    
    if (!user) {
      return c.json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }, 401)
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password_hash)
    if (!isValidPassword) {
      return c.json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }, 401)
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user, c.env)
    
    // Update last login
    await c.env.DB.prepare(`
      UPDATE users 
      SET last_login = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(user.id).run()
    
    // Log login activity
    await logActivity(c.env.DB, user.id, 'login', {
      ip: c.req.header('CF-Connecting-IP'),
      userAgent: c.req.header('User-Agent')
    })
    
    // Store refresh token in KV (optional for token blacklisting)
    await c.env.SESSIONS.put(`refresh_${user.id}`, refreshToken, {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days
    })
    
    // Return user data without password
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
    
    return c.json({
      success: true,
      user: userData,
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Login error:', error)
    return c.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, 500)
  }
})

// POST /api/auth/register (Admin only in production)
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(validatedData.email).first()
    
    if (existingUser) {
      return c.json({ 
        error: 'User already exists',
        code: 'USER_EXISTS'
      }, 409)
    }
    
    // Hash password
    const passwordHash = await hashPassword(validatedData.password)
    
    // Create user
    const userId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      userId,
      validatedData.email,
      passwordHash,
      validatedData.name,
      validatedData.role,
      validatedData.phone || null
    ).run()
    
    // Initialize staff stats
    await c.env.DB.prepare(`
      INSERT INTO staff_stats (user_id, created_at, updated_at)
      VALUES (?, datetime('now'), datetime('now'))
    `).bind(userId).run()
    
    // Log registration activity
    await logActivity(c.env.DB, userId, 'register', {
      role: validatedData.role
    })
    
    // Get created user
    const newUser = await c.env.DB.prepare(`
      SELECT id, email, name, role FROM users WHERE id = ?
    `).bind(userId).first()
    
    return c.json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    }, 201)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Registration error:', error)
    return c.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, 500)
  }
})

// POST /api/auth/refresh
auth.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json()
    
    if (!refreshToken) {
      return c.json({ 
        error: 'Refresh token required',
        code: 'TOKEN_REQUIRED'
      }, 400)
    }
    
    // Verify refresh token
    const payload = await verify(refreshToken, c.env.JWT_SECRET)
    
    // Check if user still exists and is active
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role, is_active FROM users 
      WHERE id = ? AND is_active = 1
    `).bind(payload.id).first()
    
    if (!user) {
      return c.json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_TOKEN'
      }, 401)
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user, c.env)
    
    // Update refresh token in KV
    await c.env.SESSIONS.put(`refresh_${user.id}`, newRefreshToken, {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days
    })
    
    return c.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60 // 15 minutes
    })
    
  } catch (error) {
    console.error('Token refresh error:', error)
    return c.json({ 
      error: 'Invalid refresh token',
      code: 'INVALID_TOKEN'
    }, 401)
  }
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ success: true, message: 'Logged out successfully' })
    }
    
    const token = authHeader.substring(7)
    const payload = await verify(token, c.env.JWT_SECRET)
    
    // Remove refresh token from KV
    await c.env.SESSIONS.delete(`refresh_${payload.id}`)
    
    // Log logout activity
    await logActivity(c.env.DB, payload.id, 'logout')
    
    return c.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
    
  } catch (error) {
    // Even if token verification fails, we consider logout successful
    return c.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
  }
})

// ==========================================
// PROTECTED ROUTES (Require authentication)
// ==========================================

// GET /api/auth/me
auth.get('/me', async (c) => {
  try {
    const user = c.get('user') // Set by auth middleware
    
    // Get user with stats
    const userWithStats = await c.env.DB.prepare(`
      SELECT 
        u.id, u.email, u.name, u.role, u.phone, u.avatar_url, u.last_login,
        s.total_sales, s.total_orders, s.total_points, s.level, s.current_streak
      FROM users u
      LEFT JOIN staff_stats s ON u.id = s.user_id
      WHERE u.id = ? AND u.is_active = 1
    `).bind(user.id).first()
    
    if (!userWithStats) {
      return c.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404)
    }
    
    return c.json({
      success: true,
      user: userWithStats
    })
    
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, 500)
  }
})

// PUT /api/auth/profile
auth.put('/profile', async (c) => {
  try {
    const user = c.get('user')
    const { name, phone } = await c.req.json()
    
    // Validate input
    if (!name || name.trim().length < 2) {
      return c.json({ 
        error: 'Name must be at least 2 characters',
        code: 'VALIDATION_ERROR'
      }, 400)
    }
    
    // Update user profile
    await c.env.DB.prepare(`
      UPDATE users 
      SET name = ?, phone = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(name.trim(), phone || null, user.id).run()
    
    // Log profile update
    await logActivity(c.env.DB, user.id, 'profile_update', {
      changes: { name, phone }
    })
    
    // Get updated user
    const updatedUser = await c.env.DB.prepare(`
      SELECT id, email, name, role, phone, avatar_url FROM users WHERE id = ?
    `).bind(user.id).first()
    
    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    })
    
  } catch (error) {
    console.error('Profile update error:', error)
    return c.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, 500)
  }
})

// PUT /api/auth/change-password
auth.put('/change-password', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = changePasswordSchema.parse(body)
    
    // Get current user with password
    const currentUser = await c.env.DB.prepare(`
      SELECT password_hash FROM users WHERE id = ?
    `).bind(user.id).first()
    
    if (!currentUser) {
      return c.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, 404)
    }
    
    // Verify current password
    const isValidPassword = await verifyPassword(
      validatedData.currentPassword, 
      currentUser.password_hash
    )
    
    if (!isValidPassword) {
      return c.json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      }, 400)
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(validatedData.newPassword)
    
    // Update password
    await c.env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newPasswordHash, user.id).run()
    
    // Invalidate all refresh tokens for this user
    await c.env.SESSIONS.delete(`refresh_${user.id}`)
    
    // Log password change
    await logActivity(c.env.DB, user.id, 'password_change')
    
    return c.json({
      success: true,
      message: 'Password changed successfully'
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Password change error:', error)
    return c.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, 500)
  }
})

export default auth