/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides fine-grained permissions for different user roles
 */

// Role hierarchy and permissions
const ROLES = {
    admin: {
      level: 3,
      permissions: [
        'users:create', 'users:read', 'users:update', 'users:delete',
        'products:create', 'products:read', 'products:update', 'products:delete',
        'orders:create', 'orders:read', 'orders:update', 'orders:cancel',
        'customers:create', 'customers:read', 'customers:update', 'customers:delete',
        'staff:read', 'staff:manage', 'staff:reports',
        'analytics:read', 'analytics:export',
        'settings:read', 'settings:update',
        'inventory:manage', 'inventory:adjust',
        'reports:generate', 'reports:export',
        'pos:operate', 'pos:refund'
      ]
    },
    staff: {
      level: 2,
      permissions: [
        'products:create', 'products:read', 'products:update',
        'orders:read', 'orders:update',
        'customers:create', 'customers:read', 'customers:update',
        'inventory:read', 'inventory:adjust',
        'analytics:read',
        'pos:operate'
      ]
    },
    cashier: {
      level: 1,
      permissions: [
        'products:read',
        'orders:create', 'orders:read',
        'customers:create', 'customers:read', 'customers:update',
        'pos:operate'
      ]
    }
  }
  
  // Resource-specific permissions
  const RESOURCE_PERMISSIONS = {
    // User management
    'GET /api/users': ['users:read'],
    'POST /api/users': ['users:create'],
    'PUT /api/users/:id': ['users:update'],
    'DELETE /api/users/:id': ['users:delete'],
    
    // Product management
    'GET /api/products': ['products:read'],
    'POST /api/products': ['products:create'],
    'PUT /api/products/:id': ['products:update'],
    'DELETE /api/products/:id': ['products:delete'],
    'PUT /api/products/:id/stock': ['inventory:manage'],
    
    // Order management
    'GET /api/orders': ['orders:read'],
    'POST /api/orders': ['orders:create'],
    'PUT /api/orders/:id': ['orders:update'],
    'DELETE /api/orders/:id': ['orders:cancel'],
    
    // Customer management
    'GET /api/customers': ['customers:read'],
    'POST /api/customers': ['customers:create'],
    'PUT /api/customers/:id': ['customers:update'],
    'DELETE /api/customers/:id': ['customers:delete'],
    
    // Staff management
    'GET /api/staff': ['staff:read'],
    'PUT /api/staff/:id': ['staff:manage'],
    'GET /api/staff/leaderboard': ['staff:reports'],
    
    // Analytics
    'GET /api/analytics': ['analytics:read'],
    'POST /api/analytics/export': ['analytics:export'],
    
    // Settings
    'GET /api/settings': ['settings:read'],
    'PUT /api/settings': ['settings:update'],
    
    // Inventory
    'GET /api/inventory': ['inventory:read'],
    'PUT /api/inventory/:id': ['inventory:adjust'],
    
    // Reports
    'GET /api/reports': ['reports:generate'],
    'POST /api/reports/export': ['reports:export']
  }
  
  /**
   * Check if user has required permission
   */
  function hasPermission(userRole, requiredPermission) {
    const role = ROLES[userRole]
    if (!role) return false
    
    return role.permissions.includes(requiredPermission)
  }
  
  /**
   * Check if user has any of the required permissions
   */
  function hasAnyPermission(userRole, requiredPermissions) {
    return requiredPermissions.some(permission => hasPermission(userRole, permission))
  }
  
  /**
   * Check if user has all required permissions
   */
  function hasAllPermissions(userRole, requiredPermissions) {
    return requiredPermissions.every(permission => hasPermission(userRole, permission))
  }
  
  /**
   * Check role hierarchy (if user role is equal or higher than required role)
   */
  function hasRoleLevel(userRole, requiredRole) {
    const userRoleData = ROLES[userRole]
    const requiredRoleData = ROLES[requiredRole]
    
    if (!userRoleData || !requiredRoleData) return false
    
    return userRoleData.level >= requiredRoleData.level
  }
  
  /**
   * Get permissions for route
   */
  function getRoutePermissions(method, path) {
    // Try exact match first
    const exactKey = `${method} ${path}`
    if (RESOURCE_PERMISSIONS[exactKey]) {
      return RESOURCE_PERMISSIONS[exactKey]
    }
    
    // Try pattern matching for parameterized routes
    for (const [routePattern, permissions] of Object.entries(RESOURCE_PERMISSIONS)) {
      if (routePattern.startsWith(method)) {
        const pattern = routePattern.substring(method.length + 1) // Remove "METHOD "
        const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$')
        
        if (regex.test(path)) {
          return permissions
        }
      }
    }
    
    return []
  }
  
  /**
   * Main RBAC middleware factory
   * @param {string|string[]} requiredRoles - Required role(s) for access
   * @param {string|string[]} requiredPermissions - Required permission(s) for access
   * @param {object} options - Additional options
   */
  export function rbacMiddleware(requiredRoles = [], requiredPermissions = [], options = {}) {
    // Normalize to arrays
    if (typeof requiredRoles === 'string') requiredRoles = [requiredRoles]
    if (typeof requiredPermissions === 'string') requiredPermissions = [requiredPermissions]
    
    return async (c, next) => {
      try {
        const user = c.get('user')
        
        if (!user) {
          return c.json({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }, 401)
        }
        
        const userRole = user.role
        const method = c.req.method
        const path = c.req.path
        
        // Check role-based access
        if (requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role => hasRoleLevel(userRole, role))
          
          if (!hasRequiredRole) {
            await logAccessDenied(c.env.DB, user.id, method, path, 'insufficient_role')
            
            return c.json({
              error: 'Insufficient role permissions',
              code: 'INSUFFICIENT_ROLE',
              required: requiredRoles,
              current: userRole
            }, 403)
          }
        }
        
        // Check permission-based access
        let permissionsToCheck = requiredPermissions
        
        // If no permissions specified, get from route mapping
        if (permissionsToCheck.length === 0) {
          permissionsToCheck = getRoutePermissions(method, path)
        }
        
        if (permissionsToCheck.length > 0) {
          const hasRequiredPermission = options.requireAll 
            ? hasAllPermissions(userRole, permissionsToCheck)
            : hasAnyPermission(userRole, permissionsToCheck)
          
          if (!hasRequiredPermission) {
            await logAccessDenied(c.env.DB, user.id, method, path, 'insufficient_permissions')
            
            return c.json({
              error: 'Insufficient permissions',
              code: 'INSUFFICIENT_PERMISSIONS',
              required: permissionsToCheck,
              current: ROLES[userRole]?.permissions || []
            }, 403)
          }
        }
        
        // Resource-specific access control
        if (options.resourceOwnership) {
          const hasAccess = await checkResourceOwnership(c, user, options.resourceOwnership)
          
          if (!hasAccess) {
            await logAccessDenied(c.env.DB, user.id, method, path, 'resource_ownership')
            
            return c.json({
              error: 'Access denied to resource',
              code: 'RESOURCE_ACCESS_DENIED'
            }, 403)
          }
        }
        
        // Set permission context for downstream handlers
        c.set('userPermissions', ROLES[userRole]?.permissions || [])
        c.set('userRoleLevel', ROLES[userRole]?.level || 0)
        
        await next()
        
      } catch (error) {
        console.error('RBAC middleware error:', error)
        return c.json({
          error: 'Access control error',
          code: 'RBAC_ERROR'
        }, 500)
      }
    }
  }
  
  /**
   * Quick role check middleware
   */
  export function requireRole(roles) {
    return rbacMiddleware(roles)
  }
  
  /**
   * Quick permission check middleware
   */
  export function requirePermission(permissions, requireAll = false) {
    return rbacMiddleware([], permissions, { requireAll })
  }
  
  /**
   * Admin only middleware
   */
  export function adminOnly() {
    return rbacMiddleware(['admin'])
  }
  
  /**
   * Staff or Admin middleware
   */
  export function staffOrAdmin() {
    return rbacMiddleware(['staff', 'admin'])
  }
  
  /**
   * Self or Admin access (for user profile updates, etc.)
   */
  export function selfOrAdmin(userIdParam = 'id') {
    return async (c, next) => {
      const user = c.get('user')
      const targetUserId = c.req.param(userIdParam)
      
      // Admin can access anyone
      if (user.role === 'admin') {
        return await next()
      }
      
      // Users can only access their own resources
      if (user.id === targetUserId) {
        return await next()
      }
      
      return c.json({
        error: 'Can only access your own resources',
        code: 'SELF_ACCESS_ONLY'
      }, 403)
    }
  }
  
  /**
   * Cashier ownership check (cashiers can only see their own orders)
   */
  export function cashierOwnership() {
    return async (c, next) => {
      const user = c.get('user')
      
      // Admin and staff can see all
      if (['admin', 'staff'].includes(user.role)) {
        return await next()
      }
      
      // Cashiers can only see their own orders
      if (user.role === 'cashier') {
        // Add cashier filter to query
        c.set('cashierFilter', user.id)
      }
      
      await next()
    }
  }
  
  /**
   * Check resource ownership
   */
  async function checkResourceOwnership(c, user, ownershipConfig) {
    try {
      const { table, idParam = 'id', ownerField = 'user_id' } = ownershipConfig
      const resourceId = c.req.param(idParam)
      
      if (!resourceId) return true // Skip if no resource ID
      
      const query = `SELECT ${ownerField} FROM ${table} WHERE id = ?`
      const result = await c.env.DB.prepare(query).bind(resourceId).first()
      
      if (!result) return false // Resource not found
      
      return result[ownerField] === user.id
      
    } catch (error) {
      console.error('Resource ownership check error:', error)
      return false
    }
  }
  
  /**
   * Log access denied attempts
   */
  async function logAccessDenied(db, userId, method, path, reason) {
    try {
      await db.prepare(`
        INSERT INTO activity_logs (
          user_id, action, entity_type, entity_id, 
          new_values, created_at
        )
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        userId,
        'access_denied',
        'rbac',
        null,
        JSON.stringify({ method, path, reason })
      ).run()
    } catch (error) {
      console.error('Failed to log access denied:', error)
    }
  }
  
  /**
   * Get user permissions helper
   */
  export function getUserPermissions(userRole) {
    return ROLES[userRole]?.permissions || []
  }
  
  /**
   * Check if user can perform action
   */
  export function canPerformAction(userRole, action) {
    return hasPermission(userRole, action)
  }
  
  /**
   * Permission checker for UI
   */
  export function createPermissionChecker(userRole) {
    return {
      can: (permission) => hasPermission(userRole, permission),
      canAny: (permissions) => hasAnyPermission(userRole, permissions),
      canAll: (permissions) => hasAllPermissions(userRole, permissions),
      hasRole: (role) => hasRoleLevel(userRole, role),
      permissions: getUserPermissions(userRole),
      roleLevel: ROLES[userRole]?.level || 0
    }
  }
  
  /**
   * Export role definitions for frontend
   */
  export { ROLES, RESOURCE_PERMISSIONS }