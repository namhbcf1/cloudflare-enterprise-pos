/**
 * ============================================================================
 * AUTHENTICATION ROUTES
 * ============================================================================
 * Handles user authentication, registration, and session management
 */

import { Hono } from 'hono';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { validationMiddleware } from '../middleware/validation.js';

const auth = new Hono();
const authController = new AuthController();

/**
 * Authentication validation schemas
 */
const loginSchema = {
  email: { type: 'string', required: true, format: 'email' },
  password: { type: 'string', required: true, minLength: 6 },
  remember_me: { type: 'boolean', required: false }
};

const registerSchema = {
  email: { type: 'string', required: true, format: 'email' },
  password: { type: 'string', required: true, minLength: 8 },
  first_name: { type: 'string', required: true, minLength: 2 },
  last_name: { type: 'string', required: true, minLength: 2 },
  role: { type: 'string', required: false, enum: ['staff', 'cashier'] },
  phone: { type: 'string', required: false }
};

const changePasswordSchema = {
  current_password: { type: 'string', required: true },
  new_password: { type: 'string', required: true, minLength: 8 },
  confirm_password: { type: 'string', required: true }
};

const forgotPasswordSchema = {
  email: { type: 'string', required: true, format: 'email' }
};

const resetPasswordSchema = {
  token: { type: 'string', required: true },
  password: { type: 'string', required: true, minLength: 8 },
  confirm_password: { type: 'string', required: true }
};

/**
 * @route POST /login
 * @desc User login
 * @access Public
 */
auth.post('/login', validationMiddleware(loginSchema), async (c) => {
  return await authController.login(c);
});

/**
 * @route POST /register
 * @desc User registration (admin only)
 * @access Private (Admin)
 */
auth.post('/register', authMiddleware, validationMiddleware(registerSchema), async (c) => {
  return await authController.register(c);
});

/**
 * @route POST /logout
 * @desc User logout
 * @access Private
 */
auth.post('/logout', authMiddleware, async (c) => {
  return await authController.logout(c);
});

/**
 * @route POST /logout-all
 * @desc Logout from all devices
 * @access Private
 */
auth.post('/logout-all', authMiddleware, async (c) => {
  return await authController.logoutAll(c);
});

/**
 * @route GET /me
 * @desc Get current user profile
 * @access Private
 */
auth.get('/me', authMiddleware, async (c) => {
  return await authController.getProfile(c);
});

/**
 * @route PUT /me
 * @desc Update current user profile
 * @access Private
 */
auth.put('/me', authMiddleware, async (c) => {
  return await authController.updateProfile(c);
});

/**
 * @route POST /change-password
 * @desc Change user password
 * @access Private
 */
auth.post('/change-password', authMiddleware, validationMiddleware(changePasswordSchema), async (c) => {
  return await authController.changePassword(c);
});

/**
 * @route POST /forgot-password
 * @desc Request password reset
 * @access Public
 */
auth.post('/forgot-password', validationMiddleware(forgotPasswordSchema), async (c) => {
  return await authController.forgotPassword(c);
});

/**
 * @route POST /reset-password
 * @desc Reset password with token
 * @access Public
 */
auth.post('/reset-password', validationMiddleware(resetPasswordSchema), async (c) => {
  return await authController.resetPassword(c);
});

/**
 * @route POST /verify-email
 * @desc Verify email address
 * @access Public
 */
auth.post('/verify-email', async (c) => {
  return await authController.verifyEmail(c);
});

/**
 * @route POST /resend-verification
 * @desc Resend email verification
 * @access Private
 */
auth.post('/resend-verification', authMiddleware, async (c) => {
  return await authController.resendVerification(c);
});

/**
 * @route GET /sessions
 * @desc Get active sessions
 * @access Private
 */
auth.get('/sessions', authMiddleware, async (c) => {
  return await authController.getSessions(c);
});

/**
 * @route DELETE /sessions/:sessionId
 * @desc Revoke specific session
 * @access Private
 */
auth.delete('/sessions/:sessionId', authMiddleware, async (c) => {
  return await authController.revokeSession(c);
});

/**
 * @route POST /refresh-token
 * @desc Refresh JWT token
 * @access Private
 */
auth.post('/refresh-token', authMiddleware, async (c) => {
  return await authController.refreshToken(c);
});

/**
 * @route GET /permissions
 * @desc Get user permissions
 * @access Private
 */
auth.get('/permissions', authMiddleware, async (c) => {
  return await authController.getPermissions(c);
});

/**
 * @route POST /two-factor/setup
 * @desc Setup two-factor authentication
 * @access Private
 */
auth.post('/two-factor/setup', authMiddleware, async (c) => {
  return await authController.setupTwoFactor(c);
});

/**
 * @route POST /two-factor/verify
 * @desc Verify two-factor authentication
 * @access Private
 */
auth.post('/two-factor/verify', authMiddleware, async (c) => {
  return await authController.verifyTwoFactor(c);
});

/**
 * @route POST /two-factor/disable
 * @desc Disable two-factor authentication
 * @access Private
 */
auth.post('/two-factor/disable', authMiddleware, async (c) => {
  return await authController.disableTwoFactor(c);
});

/**
 * @route GET /api-keys
 * @desc Get user's API keys
 * @access Private
 */
auth.get('/api-keys', authMiddleware, async (c) => {
  return await authController.getApiKeys(c);
});

/**
 * @route POST /api-keys
 * @desc Create new API key
 * @access Private
 */
auth.post('/api-keys', authMiddleware, async (c) => {
  return await authController.createApiKey(c);
});

/**
 * @route DELETE /api-keys/:keyId
 * @desc Revoke API key
 * @access Private
 */
auth.delete('/api-keys/:keyId', authMiddleware, async (c) => {
  return await authController.revokeApiKey(c);
});

/**
 * @route POST /impersonate/:userId
 * @desc Impersonate another user (admin only)
 * @access Private (Admin)
 */
auth.post('/impersonate/:userId', authMiddleware, async (c) => {
  return await authController.impersonateUser(c);
});

/**
 * @route POST /stop-impersonation
 * @desc Stop impersonating and return to original user
 * @access Private
 */
auth.post('/stop-impersonation', authMiddleware, async (c) => {
  return await authController.stopImpersonation(c);
});

/**
 * @route GET /login-history
 * @desc Get user's login history
 * @access Private
 */
auth.get('/login-history', authMiddleware, async (c) => {
  return await authController.getLoginHistory(c);
});

/**
 * @route POST /check-password-strength
 * @desc Check password strength
 * @access Public
 */
auth.post('/check-password-strength', async (c) => {
  return await authController.checkPasswordStrength(c);
});

/**
 * @route GET /security-settings
 * @desc Get security settings
 * @access Private
 */
auth.get('/security-settings', authMiddleware, async (c) => {
  return await authController.getSecuritySettings(c);
});

/**
 * @route PUT /security-settings
 * @desc Update security settings
 * @access Private
 */
auth.put('/security-settings', authMiddleware, async (c) => {
  return await authController.updateSecuritySettings(c);
});

export default auth;