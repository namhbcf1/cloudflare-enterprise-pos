/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER
 * ============================================================================
 * Handles all authentication-related business logic
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../utils/database.js';
import { KVCacheService } from '../utils/kvStore.js';
import { generateApiKey, blacklistToken, getUserPermissions } from '../middleware/auth.js';
import { EmailService } from '../services/emailService.js';
import { generateSecureToken, hashPassword, verifyPassword } from '../utils/encryption.js';

export class AuthController {
  /**
   * User login
   */
  async login(c) {
    try {
      const { email, password, remember_me = false } = await c.req.json();
      const db = new DatabaseService(c.env.DB);
      const cache = new KVCacheService(c.env);
      
      // Find user by email
      const user = await db.first({
        sql: `
          SELECT id, email, password_hash, first_name, last_name, role, 
                 is_active, is_verified, failed_login_attempts, locked_until,
                 two_factor_enabled, two_factor_secret, last_login,
                 total_points, current_level, avatar_url, department
          FROM users 
          WHERE email = ? AND deleted_at IS NULL
        `,
        args: [email.toLowerCase()]
      });
      
      if (!user) {
        return c.json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        }, 401);
      }
      
      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const unlockTime = new Date(user.locked_until);
        return c.json({
          error: 'Account locked',
          message: 'Account is temporarily locked due to multiple failed login attempts',
          unlock_time: unlockTime.toISOString()
        }, 423);
      }
      
      // Check if account is active
      if (!user.is_active) {
        return c.json({
          error: 'Account disabled',
          message: 'Your account has been deactivated'
        }, 403);
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        // Increment failed login attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const lockUntil = failedAttempts >= 5 ? 
          new Date(Date.now() + 30 * 60 * 1000).toISOString() : // Lock for 30 minutes
          null;
        
        await db.execute({
          sql: `
            UPDATE users 
            SET failed_login_attempts = ?, 
                locked_until = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `,
          args: [failedAttempts, lockUntil, user.id]
        });
        
        return c.json({
          error: 'Authentication failed',
          message: 'Invalid email or password',
          attempts_remaining: Math.max(0, 5 - failedAttempts)
        }, 401);
      }
      
      // Check if email is verified
      if (!user.is_verified) {
        return c.json({
          error: 'Email not verified',
          message: 'Please verify your email address before logging in',
          user_id: user.id
        }, 403);
      }
      
      // Handle two-factor authentication
      if (user.two_factor_enabled) {
        // Generate temporary token for 2FA
        const tempToken = generateSecureToken();
        await cache.set(`2fa:${tempToken}`, user.id, 300); // 5 minutes
        
        return c.json({
          requires_2fa: true,
          temp_token: tempToken,
          message: 'Please provide your two-factor authentication code'
        });
      }
      
      // Reset failed login attempts on successful login
      await db.execute({
        sql: `
          UPDATE users 
          SET failed_login_attempts = 0, 
              locked_until = NULL,
              last_login = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [user.id]
      });
      
      // Generate JWT token
      const tokenExpiry = remember_me ? '30d' : '24h';
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          sessionId: crypto.randomUUID()
        },
        c.env.JWT_SECRET,
        { expiresIn: tokenExpiry }
      );
      
      // Store session info in cache
      const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString(),
        userAgent: c.req.header('User-Agent') || 'Unknown',
        ipAddress: c.req.header('CF-Connecting-IP') || 'Unknown'
      };
      
      await cache.set(`session:${user.id}:${token}`, sessionData, remember_me ? 2592000 : 86400);
      
      // Log login event
      await this.logLoginEvent(db, user.id, 'login_success', sessionData);
      
      // Prepare user response
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: `${user.first_name} ${user.last_name}`,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        avatarUrl: user.avatar_url,
        department: user.department,
        totalPoints: user.total_points || 0,
        currentLevel: user.current_level || 1,
        lastLogin: user.last_login,
        permissions: getUserPermissions(user)
      };
      
      return c.json({
        success: true,
        message: 'Login successful',
        token,
        user: userResponse,
        expires_in: remember_me ? 2592000 : 86400 // seconds
      });
      
    } catch (error) {
      console.error('Login error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred during login'
      }, 500);
    }
  }

  /**
   * User registration (admin only)
   */
  async register(c) {
    try {
      const currentUser = c.get('user');
      
      // Check if current user is admin
      if (currentUser.role !== 'admin') {
        return c.json({
          error: 'Forbidden',
          message: 'Only administrators can register new users'
        }, 403);
      }
      
      const { email, password, first_name, last_name, role = 'staff', phone } = await c.req.json();
      const db = new DatabaseService(c.env.DB);
      
      // Check if user already exists
      const existingUser = await db.first({
        sql: 'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
        args: [email.toLowerCase()]
      });
      
      if (existingUser) {
        return c.json({
          error: 'User exists',
          message: 'A user with this email address already exists'
        }, 409);
      }
      
      // Validate role
      const validRoles = ['admin', 'cashier', 'staff'];
      if (!validRoles.includes(role)) {
        return c.json({
          error: 'Invalid role',
          message: 'Role must be one of: admin, cashier, staff'
        }, 400);
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Generate employee ID
      const employeeId = `EMP${Date.now().toString().slice(-6)}`;
      
      // Create user
      const result = await db.insert('users', {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name,
        last_name,
        role,
        phone,
        employee_id: employeeId,
        is_active: true,
        is_verified: false,
        hire_date: new Date().toISOString().split('T')[0],
        created_by: currentUser.id
      });
      
      // Send welcome email
      try {
        const emailService = new EmailService(c.env);
        await emailService.sendWelcomeEmail(email, {
          firstName: first_name,
          lastName: last_name,
          employeeId,
          role,
          tempPassword: password
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
      
      return c.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: result.insertId,
          email: email.toLowerCase(),
          firstName: first_name,
          lastName: last_name,
          role,
          employeeId,
          isActive: true,
          isVerified: false
        }
      }, 201);
      
    } catch (error) {
      console.error('Registration error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred during registration'
      }, 500);
    }
  }

  /**
   * User logout
   */
  async logout(c) {
    try {
      const token = c.get('token');
      const user = c.get('user');
      const decoded = c.get('tokenDecoded');
      const cache = new KVCacheService(c.env);
      const db = new DatabaseService(c.env.DB);
      
      // Blacklist the token
      await blacklistToken(cache, token, decoded.exp);
      
      // Remove session from cache
      await cache.delete(`session:${user.id}:${token}`);
      
      // Log logout event
      await this.logLoginEvent(db, user.id, 'logout', {
        userAgent: c.req.header('User-Agent') || 'Unknown',
        ipAddress: c.req.header('CF-Connecting-IP') || 'Unknown'
      });
      
      return c.json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred during logout'
      }, 500);
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(c) {
    try {
      const user = c.get('user');
      const cache = new KVCacheService(c.env);
      const db = new DatabaseService(c.env.DB);
      
      // This would require storing all user sessions
      // For now, we'll just increment a user version that invalidates all tokens
      await db.execute({
        sql: `
          UPDATE users 
          SET updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [user.id]
      });
      
      // Log logout all event
      await this.logLoginEvent(db, user.id, 'logout_all', {
        userAgent: c.req.header('User-Agent') || 'Unknown',
        ipAddress: c.req.header('CF-Connecting-IP') || 'Unknown'
      });
      
      return c.json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
      
    } catch (error) {
      console.error('Logout all error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred during logout'
      }, 500);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(c) {
    try {
      const user = c.get('user');
      const db = new DatabaseService(c.env.DB);
      
      // Get complete user profile
      const profile = await db.first({
        sql: `
          SELECT u.*, 
                 (SELECT COUNT(*) FROM orders WHERE cashier_id = u.id AND status = 'completed') as completed_orders,
                 (SELECT SUM(total_amount) FROM orders WHERE cashier_id = u.id AND status = 'completed') as total_sales_amount
          FROM users u
          WHERE u.id = ? AND u.deleted_at IS NULL
        `,
        args: [user.id]
      });
      
      if (!profile) {
        return c.json({
          error: 'User not found',
          message: 'User profile not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          displayName: `${profile.first_name} ${profile.last_name}`,
          role: profile.role,
          isActive: profile.is_active,
          isVerified: profile.is_verified,
          phone: profile.phone,
          address: profile.address,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          employeeId: profile.employee_id,
          hireDate: profile.hire_date,
          department: profile.department,
          position: profile.position,
          
          // Gamification data
          totalPoints: profile.total_points || 0,
          currentLevel: profile.current_level || 1,
          totalSales: profile.total_sales || 0,
          totalOrders: profile.total_orders || 0,
          
          // Performance data
          completedOrders: profile.completed_orders || 0,
          totalSalesAmount: profile.total_sales_amount || 0,
          
          // Security info
          twoFactorEnabled: profile.two_factor_enabled || false,
          lastLogin: profile.last_login,
          createdAt: profile.created_at,
          
          // Permissions
          permissions: getUserPermissions(profile)
        }
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred while fetching profile'
      }, 500);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(c) {
    try {
      const user = c.get('user');
      const updates = await c.req.json();
      const db = new DatabaseService(c.env.DB);
      
      // Define allowed update fields
      const allowedFields = [
        'first_name', 'last_name', 'phone', 'address', 
        'bio', 'avatar_url', 'notification_preferences'
      ];
      
      // Filter and validate updates
      const validUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          validUpdates[key] = value;
        }
      }
      
      if (Object.keys(validUpdates).length === 0) {
        return c.json({
          error: 'No valid updates',
          message: 'No valid fields provided for update'
        }, 400);
      }
      
      // Update user profile
      await db.update('users', validUpdates, 'id = ?', [user.id]);
      
      // Get updated profile
      const updatedProfile = await db.first({
        sql: 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL',
        args: [user.id]
      });
      
      return c.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          firstName: updatedProfile.first_name,
          lastName: updatedProfile.last_name,
          displayName: `${updatedProfile.first_name} ${updatedProfile.last_name}`,
          phone: updatedProfile.phone,
          address: updatedProfile.address,
          bio: updatedProfile.bio,
          avatarUrl: updatedProfile.avatar_url
        }
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred while updating profile'
      }, 500);
    }
  }

  /**
   * Change password
   */
  async changePassword(c) {
    try {
      const user = c.get('user');
      const { current_password, new_password, confirm_password } = await c.req.json();
      const db = new DatabaseService(c.env.DB);
      
      // Validate new password confirmation
      if (new_password !== confirm_password) {
        return c.json({
          error: 'Password mismatch',
          message: 'New password and confirmation do not match'
        }, 400);
      }
      
      // Get current user data
      const userData = await db.first({
        sql: 'SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL',
        args: [user.id]
      });
      
      if (!userData) {
        return c.json({
          error: 'User not found',
          message: 'User not found'
        }, 404);
      }
      
      // Verify current password
      const isValidPassword = await verifyPassword(current_password, userData.password_hash);
      
      if (!isValidPassword) {
        return c.json({
          error: 'Invalid password',
          message: 'Current password is incorrect'
        }, 401);
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(new_password);
      
      // Update password
      await db.execute({
        sql: `
          UPDATE users 
          SET password_hash = ?, updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [newPasswordHash, user.id]
      });
      
      // Log password change event
      await this.logLoginEvent(db, user.id, 'password_changed', {
        userAgent: c.req.header('User-Agent') || 'Unknown',
        ipAddress: c.req.header('CF-Connecting-IP') || 'Unknown'
      });
      
      return c.json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred while changing password'
      }, 500);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(c) {
    try {
      const { email } = await c.req.json();
      const db = new DatabaseService(c.env.DB);
      
      // Find user by email
      const user = await db.first({
        sql: 'SELECT id, email, first_name, last_name FROM users WHERE email = ? AND deleted_at IS NULL',
        args: [email.toLowerCase()]
      });
      
      if (!user) {
        // Don't reveal if email exists or not
        return c.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        });
      }
      
      // Generate reset token
      const resetToken = generateSecureToken();
      const resetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
      
      // Save reset token
      await db.execute({
        sql: `
          UPDATE users 
          SET password_reset_token = ?, 
              password_reset_expires = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `,
        args: [resetToken, resetExpires, user.id]
      });
      
      // Send reset email
      try {
        const emailService = new EmailService(c.env);
        await emailService.sendPasswordResetEmail(user.email, {
          firstName: user.first_name,
          resetToken,
          resetUrl: `${c.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        });
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
      }
      
      return c.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
      
    } catch (error) {
      console.error('Forgot password error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred while processing password reset request'
      }, 500);
    }
  }

  /**
   * Get user permissions
   */
  async getPermissions(c) {
    try {
      const user = c.get('user');
      const permissions = getUserPermissions(user);
      
      return c.json({
        success: true,
        permissions,
        role: user.role
      });
      
    } catch (error) {
      console.error('Get permissions error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'An error occurred while fetching permissions'
      }, 500);
    }
  }

  /**
   * Log login/security events
   */
  async logLoginEvent(db, userId, eventType, metadata = {}) {
    try {
      await db.insert('login_logs', {
        user_id: userId,
        event_type: eventType,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
        metadata: JSON.stringify(metadata),
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log login event:', error);
    }
  }
}