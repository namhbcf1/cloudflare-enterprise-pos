/**
 * Authentication Routes for Cloudflare Workers
 * Handles login, logout, registration, password reset, and token refresh
 */

import { 
  authenticateRequest, 
  generateToken, 
  verifyToken, 
  createAuthResponse,
  SessionManager,
  checkRateLimit,
  USER_ROLES
} from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

/**
* Hash password using bcrypt
* @param {string} password - Plain text password
* @returns {Promise<string>} Hashed password
*/
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
* Compare password with hash
* @param {string} password - Plain text password
* @param {string} hash - Hashed password
* @returns {Promise<boolean>} Password matches
*/
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
* Validate email format
* @param {string} email - Email address
* @returns {boolean} Is valid email
*/
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
* Validate password strength
* @param {string} password - Password
* @returns {Object} Validation result
*/
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
      errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
  }
  
  return {
      isValid: errors.length === 0,
      errors
  };
}

/**
* Get user by email or username
* @param {string} identifier - Email or username
* @param {Object} env - Environment variables
* @returns {Promise<Object|null>} User object
*/
async function getUserByIdentifier(identifier, env) {
  try {
      const stmt = env.DB.prepare(`
          SELECT * FROM users 
          WHERE (email = ? OR username = ?) AND status = 'active'
      `);
      return await stmt.bind(identifier, identifier).first();
  } catch (error) {
      console.error('Database error in getUserByIdentifier:', error);
      return null;
  }
}

/**
* Create new user
* @param {Object} userData - User data
* @param {Object} env - Environment variables
* @returns {Promise<Object>} Created user
*/
async function createUser(userData, env) {
  try {
      const userId = crypto.randomUUID();
      const hashedPassword = await hashPassword(userData.password);
      
      const stmt = env.DB.prepare(`
          INSERT INTO users (
              id, email, username, password_hash, full_name, 
              role, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
      `);
      
      await stmt.bind(
          userId,
          userData.email,
          userData.username,
          hashedPassword,
          userData.fullName,
          userData.role || USER_ROLES.STAFF
      ).run();
      
      // Get created user (without password)
      const user = await env.DB.prepare(`
          SELECT id, email, username, full_name, role, status, created_at
          FROM users WHERE id = ?
      `).bind(userId).first();
      
      return user;
  } catch (error) {
      console.error('Error creating user:', error);
      throw error;
  }
}

/**
* Login endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function login(request, env, ctx) {
  try {
      const body = await request.json();
      const { identifier, password, deviceInfo = '' } = body;
      
      // Input validation
      if (!identifier || !password) {
          return createAuthResponse(false, 'Email/username and password are required', null, 400);
      }
      
      // Rate limiting
      const rateLimitKey = `login_attempts:${identifier}`;
      if (!(await checkRateLimit(rateLimitKey, env, 5))) {
          return createAuthResponse(false, 'Too many login attempts. Please try again later.', null, 429);
      }
      
      // Get user
      const user = await getUserByIdentifier(identifier, env);
      if (!user) {
          return createAuthResponse(false, 'Invalid credentials', null, 401);
      }
      
      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
          return createAuthResponse(false, 'Invalid credentials', null, 401);
      }
      
      // Check user status
      if (user.status !== 'active') {
          return createAuthResponse(false, 'Account is not active', null, 401);
      }
      
      // Create session
      const sessionManager = new SessionManager(env);
      const sessionId = await sessionManager.createSession(user.id, deviceInfo);
      
      // Generate tokens
      const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          sessionId
      };
      
      const accessToken = await generateToken(tokenPayload, env.JWT_SECRET, 'access');
      const refreshToken = await generateToken(tokenPayload, env.JWT_SECRET, 'refresh');
      
      // Update last login
      await env.DB.prepare(`
          UPDATE users SET last_login = datetime('now') WHERE id = ?
      `).bind(user.id).run();
      
      // Response data
      const responseData = {
          user: {
              id: user.id,
              email: user.email,
              username: user.username,
              fullName: user.full_name,
              role: user.role,
              status: user.status,
              lastLogin: user.last_login,
              createdAt: user.created_at
          },
          tokens: {
              accessToken,
              refreshToken,
              expiresIn: 24 * 60 * 60 // 24 hours in seconds
          },
          sessionId
      };
      
      return createAuthResponse(true, 'Login successful', responseData);
      
  } catch (error) {
      console.error('Login error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Logout endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function logout(request, env, ctx) {
  try {
      const auth = await authenticateRequest(request, env, ctx);
      
      if (!auth.success) {
          return createAuthResponse(false, auth.error, null, auth.status);
      }
      
      // Invalidate session
      const sessionManager = new SessionManager(env);
      if (auth.user.sessionId) {
          await sessionManager.invalidateSession(auth.user.sessionId);
      }
      
      return createAuthResponse(true, 'Logout successful');
      
  } catch (error) {
      console.error('Logout error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Refresh token endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function refreshToken(request, env, ctx) {
  try {
      const body = await request.json();
      const { refreshToken } = body;
      
      if (!refreshToken) {
          return createAuthResponse(false, 'Refresh token is required', null, 400);
      }
      
      // Verify refresh token
      const payload = await verifyToken(refreshToken, env.JWT_SECRET);
      if (!payload || payload.type !== 'refresh') {
          return createAuthResponse(false, 'Invalid refresh token', null, 401);
      }
      
      // Get user
      const user = await env.DB.prepare(`
          SELECT id, email, username, full_name, role, status 
          FROM users WHERE id = ? AND status = 'active'
      `).bind(payload.userId).first();
      
      if (!user) {
          return createAuthResponse(false, 'User not found', null, 401);
      }
      
      // Generate new access token
      const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          sessionId: payload.sessionId
      };
      
      const newAccessToken = await generateToken(tokenPayload, env.JWT_SECRET, 'access');
      
      const responseData = {
          accessToken: newAccessToken,
          expiresIn: 24 * 60 * 60 // 24 hours in seconds
      };
      
      return createAuthResponse(true, 'Token refreshed successfully', responseData);
      
  } catch (error) {
      console.error('Refresh token error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Register endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function register(request, env, ctx) {
  try {
      const body = await request.json();
      const { email, username, password, fullName, role } = body;
      
      // Input validation
      if (!email || !username || !password || !fullName) {
          return createAuthResponse(false, 'All fields are required', null, 400);
      }
      
      if (!isValidEmail(email)) {
          return createAuthResponse(false, 'Invalid email format', null, 400);
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
          return createAuthResponse(false, 'Password validation failed', {
              errors: passwordValidation.errors
          }, 400);
      }
      
      // Check if user already exists
      const existingUser = await getUserByIdentifier(email, env);
      if (existingUser) {
          return createAuthResponse(false, 'User already exists', null, 409);
      }
      
      const existingUsername = await getUserByIdentifier(username, env);
      if (existingUsername) {
          return createAuthResponse(false, 'Username already taken', null, 409);
      }
      
      // Create user
      const userData = {
          email,
          username,
          password,
          fullName,
          role: role || USER_ROLES.STAFF
      };
      
      const newUser = await createUser(userData, env);
      
      return createAuthResponse(true, 'User registered successfully', {
          user: newUser
      }, 201);
      
  } catch (error) {
      console.error('Registration error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Get current user endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function getCurrentUser(request, env, ctx) {
  try {
      const auth = await authenticateRequest(request, env, ctx);
      
      if (!auth.success) {
          return createAuthResponse(false, auth.error, null, auth.status);
      }
      
      return createAuthResponse(true, 'User retrieved successfully', {
          user: auth.user
      });
      
  } catch (error) {
      console.error('Get current user error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Change password endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function changePassword(request, env, ctx) {
  try {
      const auth = await authenticateRequest(request, env, ctx);
      
      if (!auth.success) {
          return createAuthResponse(false, auth.error, null, auth.status);
      }
      
      const body = await request.json();
      const { currentPassword, newPassword } = body;
      
      if (!currentPassword || !newPassword) {
          return createAuthResponse(false, 'Current and new passwords are required', null, 400);
      }
      
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
          return createAuthResponse(false, 'Password validation failed', {
              errors: passwordValidation.errors
          }, 400);
      }
      
      // Get user with password hash
      const user = await env.DB.prepare(`
          SELECT * FROM users WHERE id = ?
      `).bind(auth.user.id).first();
      
      if (!user) {
          return createAuthResponse(false, 'User not found', null, 404);
      }
      
      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
          return createAuthResponse(false, 'Current password is incorrect', null, 400);
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update password
      await env.DB.prepare(`
          UPDATE users 
          SET password_hash = ?, updated_at = datetime('now')
          WHERE id = ?
      `).bind(newPasswordHash, auth.user.id).run();
      
      // Invalidate all sessions except current
      await env.DB.prepare(`
          UPDATE user_sessions 
          SET is_active = 0, invalidated_at = datetime('now')
          WHERE user_id = ? AND id != ?
      `).bind(auth.user.id, auth.user.sessionId).run();
      
      return createAuthResponse(true, 'Password changed successfully');
      
  } catch (error) {
      console.error('Change password error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Forgot password endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function forgotPassword(request, env, ctx) {
  try {
      const body = await request.json();
      const { email } = body;
      
      if (!email || !isValidEmail(email)) {
          return createAuthResponse(false, 'Valid email is required', null, 400);
      }
      
      // Rate limiting
      const rateLimitKey = `forgot_password:${email}`;
      if (!(await checkRateLimit(rateLimitKey, env, 3))) {
          return createAuthResponse(false, 'Too many reset requests. Please try again later.', null, 429);
      }
      
      const user = await getUserByIdentifier(email, env);
      if (!user) {
          // Don't reveal if user exists or not
          return createAuthResponse(true, 'If the email exists, a reset link has been sent');
      }
      
      // Generate reset token
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store reset token
      await env.DB.prepare(`
          INSERT OR REPLACE INTO password_resets (user_id, token, expires_at, created_at)
          VALUES (?, ?, ?, datetime('now'))
      `).bind(user.id, resetToken, expiresAt.toISOString()).run();
      
      // TODO: Send email with reset link
      // For now, we'll just log it (in production, implement email service)
      console.log(`Password reset link for ${email}: /reset-password?token=${resetToken}`);
      
      return createAuthResponse(true, 'If the email exists, a reset link has been sent');
      
  } catch (error) {
      console.error('Forgot password error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Reset password endpoint
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function resetPassword(request, env, ctx) {
  try {
      const body = await request.json();
      const { token, newPassword } = body;
      
      if (!token || !newPassword) {
          return createAuthResponse(false, 'Token and new password are required', null, 400);
      }
      
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
          return createAuthResponse(false, 'Password validation failed', {
              errors: passwordValidation.errors
          }, 400);
      }
      
      // Verify reset token
      const resetRequest = await env.DB.prepare(`
          SELECT pr.*, u.id as user_id, u.email
          FROM password_resets pr
          JOIN users u ON pr.user_id = u.id
          WHERE pr.token = ? AND pr.expires_at > datetime('now') AND pr.used_at IS NULL
      `).bind(token).first();
      
      if (!resetRequest) {
          return createAuthResponse(false, 'Invalid or expired reset token', null, 400);
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update password
      await env.DB.prepare(`
          UPDATE users 
          SET password_hash = ?, updated_at = datetime('now')
          WHERE id = ?
      `).bind(newPasswordHash, resetRequest.user_id).run();
      
      // Mark reset token as used
      await env.DB.prepare(`
          UPDATE password_resets 
          SET used_at = datetime('now')
          WHERE token = ?
      `).bind(token).run();
      
      // Invalidate all user sessions
      await env.DB.prepare(`
          UPDATE user_sessions 
          SET is_active = 0, invalidated_at = datetime('now')
          WHERE user_id = ?
      `).bind(resetRequest.user_id).run();
      
      return createAuthResponse(true, 'Password reset successful');
      
  } catch (error) {
      console.error('Reset password error:', error);
      return createAuthResponse(false, 'Internal server error', null, 500);
  }
}

/**
* Auth routes handler
* @param {Request} request - HTTP request
* @param {Object} env - Environment variables
* @param {Object} ctx - Execution context
* @returns {Promise<Response>} HTTP response
*/
export async function handleAuthRoutes(request, env, ctx) {
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname;
  
  // Route mapping
  const routes = {
      'POST:/auth/login': login,
      'POST:/auth/logout': logout,
      'POST:/auth/refresh': refreshToken,
      'POST:/auth/register': register,
      'GET:/auth/me': getCurrentUser,
      'PUT:/auth/change-password': changePassword,
      'POST:/auth/forgot-password': forgotPassword,
      'POST:/auth/reset-password': resetPassword
  };
  
  const routeKey = `${method}:${path}`;
  const handler = routes[routeKey];
  
  if (handler) {
      return await handler(request, env, ctx);
  }
  
  return createAuthResponse(false, 'Route not found', null, 404);
}