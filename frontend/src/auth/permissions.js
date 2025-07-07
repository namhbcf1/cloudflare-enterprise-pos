/**
 * ENTERPRISE POS PERMISSIONS MATRIX
 * Ma trận phân quyền chi tiết cho hệ thống POS
 */

// ================================
// ĐỊNH NGHĨA ROLES
// ================================
export const ROLES = {
    SUPER_ADMIN: 'super_admin',    // Siêu quản trị (toàn quyền)
    ADMIN: 'admin',                // Quản trị viên (toàn quyền store)
    MANAGER: 'manager',            // Quản lý (hầu hết quyền)
    SHIFT_SUPERVISOR: 'shift_supervisor', // Trưởng ca
    CASHIER: 'cashier',            // Thu ngân
    SALES_STAFF: 'sales_staff',    // Nhân viên bán hàng
    INVENTORY_STAFF: 'inventory_staff', // Nhân viên kho
    CUSTOMER_SERVICE: 'customer_service', // Chăm sóc khách hàng
    TRAINEE: 'trainee'             // Thực tập sinh
  };
  
  // ================================
  // ĐỊNH NGHĨA PERMISSIONS
  // ================================
  
  // 🔐 Authentication & Users
  export const AUTH_PERMISSIONS = {
    VIEW_USERS: 'auth.users.view',
    CREATE_USERS: 'auth.users.create',
    UPDATE_USERS: 'auth.users.update',
    DELETE_USERS: 'auth.users.delete',
    RESET_PASSWORD: 'auth.users.reset_password',
    MANAGE_ROLES: 'auth.roles.manage',
    VIEW_AUDIT_LOG: 'auth.audit.view'
  };
  
  // 📦 Products & Inventory
  export const PRODUCT_PERMISSIONS = {
    VIEW_PRODUCTS: 'products.view',
    CREATE_PRODUCTS: 'products.create',
    UPDATE_PRODUCTS: 'products.update',
    DELETE_PRODUCTS: 'products.delete',
    MANAGE_CATEGORIES: 'products.categories.manage',
    MANAGE_PRICING: 'products.pricing.manage',
    BULK_OPERATIONS: 'products.bulk.manage',
    VIEW_INVENTORY: 'inventory.view',
    UPDATE_INVENTORY: 'inventory.update',
    STOCK_ADJUSTMENT: 'inventory.adjust',
    TRANSFER_STOCK: 'inventory.transfer',
    VIEW_STOCK_MOVEMENTS: 'inventory.movements.view'
  };
  
  // 🛒 Orders & POS
  export const ORDER_PERMISSIONS = {
    CREATE_ORDERS: 'orders.create',
    VIEW_ORDERS: 'orders.view',
    UPDATE_ORDERS: 'orders.update',
    CANCEL_ORDERS: 'orders.cancel',
    PROCESS_RETURNS: 'orders.returns.process',
    APPLY_DISCOUNTS: 'orders.discounts.apply',
    VOID_TRANSACTIONS: 'orders.void',
    ACCESS_POS: 'pos.access',
    OPEN_CASH_DRAWER: 'pos.cash_drawer.open',
    MANUAL_PRICE_OVERRIDE: 'pos.price.override',
    PROCESS_PAYMENTS: 'payments.process',
    PROCESS_REFUNDS: 'payments.refunds.process'
  };
  
  // 👥 Customers & CRM
  export const CUSTOMER_PERMISSIONS = {
    VIEW_CUSTOMERS: 'customers.view',
    CREATE_CUSTOMERS: 'customers.create',
    UPDATE_CUSTOMERS: 'customers.update',
    DELETE_CUSTOMERS: 'customers.delete',
    VIEW_CUSTOMER_HISTORY: 'customers.history.view',
    MANAGE_LOYALTY: 'customers.loyalty.manage',
    SEND_MARKETING: 'customers.marketing.send',
    EXPORT_DATA: 'customers.data.export'
  };
  
  // 👨‍💼 Staff & HR
  export const STAFF_PERMISSIONS = {
    VIEW_STAFF: 'staff.view',
    CREATE_STAFF: 'staff.create',
    UPDATE_STAFF: 'staff.update',
    DELETE_STAFF: 'staff.delete',
    MANAGE_SCHEDULES: 'staff.schedules.manage',
    VIEW_PERFORMANCE: 'staff.performance.view',
    MANAGE_COMMISSIONS: 'staff.commissions.manage',
    APPROVE_TIME_OFF: 'staff.time_off.approve'
  };
  
  // 📊 Analytics & Reports
  export const ANALYTICS_PERMISSIONS = {
    VIEW_DASHBOARD: 'analytics.dashboard.view',
    VIEW_SALES_REPORTS: 'analytics.sales.view',
    VIEW_INVENTORY_REPORTS: 'analytics.inventory.view',
    VIEW_STAFF_REPORTS: 'analytics.staff.view',
    VIEW_CUSTOMER_REPORTS: 'analytics.customers.view',
    VIEW_FINANCIAL_REPORTS: 'analytics.financial.view',
    EXPORT_REPORTS: 'analytics.reports.export',
    CREATE_CUSTOM_REPORTS: 'analytics.custom.create',
    VIEW_REAL_TIME_DATA: 'analytics.realtime.view',
    ACCESS_BI_TOOLS: 'analytics.bi.access'
  };
  
  // ⚙️ System & Settings
  export const SYSTEM_PERMISSIONS = {
    VIEW_SETTINGS: 'system.settings.view',
    UPDATE_SETTINGS: 'system.settings.update',
    MANAGE_INTEGRATIONS: 'system.integrations.manage',
    VIEW_SYSTEM_LOGS: 'system.logs.view',
    BACKUP_DATA: 'system.backup.create',
    RESTORE_DATA: 'system.backup.restore',
    MANAGE_TAXES: 'system.taxes.manage',
    MANAGE_PAYMENT_METHODS: 'system.payments.manage'
  };
  
  // 🎮 Gamification
  export const GAMIFICATION_PERMISSIONS = {
    VIEW_LEADERBOARD: 'gamification.leaderboard.view',
    MANAGE_CHALLENGES: 'gamification.challenges.manage',
    MANAGE_REWARDS: 'gamification.rewards.manage',
    VIEW_ACHIEVEMENTS: 'gamification.achievements.view',
    PARTICIPATE_COMPETITIONS: 'gamification.competitions.participate'
  };
  
  // 🤖 AI & Advanced Features
  export const AI_PERMISSIONS = {
    ACCESS_AI_INSIGHTS: 'ai.insights.access',
    USE_DEMAND_FORECASTING: 'ai.forecasting.use',
    USE_PRICE_OPTIMIZATION: 'ai.pricing.use',
    ACCESS_RECOMMENDATIONS: 'ai.recommendations.access',
    CONFIGURE_AI_SETTINGS: 'ai.settings.configure'
  };
  
  // ================================
  // ROLE PERMISSION MATRIX
  // ================================
  export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
      // Toàn quyền trên tất cả permissions
      ...Object.values(AUTH_PERMISSIONS),
      ...Object.values(PRODUCT_PERMISSIONS),
      ...Object.values(ORDER_PERMISSIONS),
      ...Object.values(CUSTOMER_PERMISSIONS),
      ...Object.values(STAFF_PERMISSIONS),
      ...Object.values(ANALYTICS_PERMISSIONS),
      ...Object.values(SYSTEM_PERMISSIONS),
      ...Object.values(GAMIFICATION_PERMISSIONS),
      ...Object.values(AI_PERMISSIONS)
    ],
  
    [ROLES.ADMIN]: [
      // Gần như toàn quyền, trừ một số quyền super admin
      AUTH_PERMISSIONS.VIEW_USERS,
      AUTH_PERMISSIONS.CREATE_USERS,
      AUTH_PERMISSIONS.UPDATE_USERS,
      AUTH_PERMISSIONS.RESET_PASSWORD,
      AUTH_PERMISSIONS.MANAGE_ROLES,
      
      ...Object.values(PRODUCT_PERMISSIONS),
      ...Object.values(ORDER_PERMISSIONS),
      ...Object.values(CUSTOMER_PERMISSIONS),
      ...Object.values(STAFF_PERMISSIONS),
      ...Object.values(ANALYTICS_PERMISSIONS),
      
      SYSTEM_PERMISSIONS.VIEW_SETTINGS,
      SYSTEM_PERMISSIONS.UPDATE_SETTINGS,
      SYSTEM_PERMISSIONS.MANAGE_INTEGRATIONS,
      SYSTEM_PERMISSIONS.MANAGE_TAXES,
      SYSTEM_PERMISSIONS.MANAGE_PAYMENT_METHODS,
      
      ...Object.values(GAMIFICATION_PERMISSIONS),
      ...Object.values(AI_PERMISSIONS)
    ],
  
    [ROLES.MANAGER]: [
      // Quản lý operational
      AUTH_PERMISSIONS.VIEW_USERS,
      
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.CREATE_PRODUCTS,
      PRODUCT_PERMISSIONS.UPDATE_PRODUCTS,
      PRODUCT_PERMISSIONS.MANAGE_PRICING,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      PRODUCT_PERMISSIONS.UPDATE_INVENTORY,
      PRODUCT_PERMISSIONS.STOCK_ADJUSTMENT,
      
      ...Object.values(ORDER_PERMISSIONS),
      ...Object.values(CUSTOMER_PERMISSIONS),
      
      STAFF_PERMISSIONS.VIEW_STAFF,
      STAFF_PERMISSIONS.MANAGE_SCHEDULES,
      STAFF_PERMISSIONS.VIEW_PERFORMANCE,
      STAFF_PERMISSIONS.MANAGE_COMMISSIONS,
      STAFF_PERMISSIONS.APPROVE_TIME_OFF,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_SALES_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_INVENTORY_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_STAFF_REPORTS,
      ANALYTICS_PERMISSIONS.EXPORT_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_REAL_TIME_DATA,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.MANAGE_CHALLENGES,
      GAMIFICATION_PERMISSIONS.MANAGE_REWARDS,
      
      AI_PERMISSIONS.ACCESS_AI_INSIGHTS,
      AI_PERMISSIONS.USE_DEMAND_FORECASTING,
      AI_PERMISSIONS.ACCESS_RECOMMENDATIONS
    ],
  
    [ROLES.SHIFT_SUPERVISOR]: [
      // Quản lý ca làm việc
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      
      ORDER_PERMISSIONS.CREATE_ORDERS,
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.UPDATE_ORDERS,
      ORDER_PERMISSIONS.PROCESS_RETURNS,
      ORDER_PERMISSIONS.APPLY_DISCOUNTS,
      ORDER_PERMISSIONS.ACCESS_POS,
      ORDER_PERMISSIONS.OPEN_CASH_DRAWER,
      ORDER_PERMISSIONS.PROCESS_PAYMENTS,
      ORDER_PERMISSIONS.PROCESS_REFUNDS,
      
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
      CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.UPDATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMER_HISTORY,
      CUSTOMER_PERMISSIONS.MANAGE_LOYALTY,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_REAL_TIME_DATA,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS,
      
      AI_PERMISSIONS.ACCESS_RECOMMENDATIONS
    ],
  
    [ROLES.INVENTORY_STAFF]: [
      // Quản lý kho
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.CREATE_PRODUCTS,
      PRODUCT_PERMISSIONS.UPDATE_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      PRODUCT_PERMISSIONS.UPDATE_INVENTORY,
      PRODUCT_PERMISSIONS.STOCK_ADJUSTMENT,
      PRODUCT_PERMISSIONS.TRANSFER_STOCK,
      PRODUCT_PERMISSIONS.VIEW_STOCK_MOVEMENTS,
      
      ORDER_PERMISSIONS.VIEW_ORDERS,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_INVENTORY_REPORTS,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS
    ],
  
    [ROLES.CUSTOMER_SERVICE]: [
      // Chăm sóc khách hàng
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.PROCESS_RETURNS,
      
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
      CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.UPDATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMER_HISTORY,
      CUSTOMER_PERMISSIONS.MANAGE_LOYALTY,
      CUSTOMER_PERMISSIONS.SEND_MARKETING,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_CUSTOMER_REPORTS,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS
    ],
  
    [ROLES.TRAINEE]: [
      // Thực tập sinh - quyền hạn chế
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.ACCESS_POS, // Với giám sát
      
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS
    ]
  };
  
  // ================================
  // UTILITY FUNCTIONS
  // ================================
  
  /**
   * Kiểm tra user có role không
   */
  export const hasRole = (user, role) => {
    if (!user || !user.role) return false;
    return user.role === role || user.roles?.includes(role);
  };
  
  /**
   * Kiểm tra user có ít nhất 1 trong các roles
   */
  export const hasAnyRole = (user, roles) => {
    if (!user || !roles?.length) return false;
    return roles.some(role => hasRole(user, role));
  };
  
  /**
   * Kiểm tra user có tất cả roles
   */
  export const hasAllRoles = (user, roles) => {
    if (!user || !roles?.length) return false;
    return roles.every(role => hasRole(user, role));
  };
  
  /**
   * Kiểm tra user có permission không
   */
  export const hasPermission = (user, permission) => {
    if (!user) return false;
    
    // Kiểm tra permission trực tiếp
    if (user.permissions?.includes(permission)) return true;
    
    // Kiểm tra permission thông qua role
    const userRole = user.role;
    if (!userRole) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  };
  
  /**
   * Kiểm tra user có ít nhất 1 permission
   */
  export const hasAnyPermission = (user, permissions) => {
    if (!user || !permissions?.length) return false;
    return permissions.some(permission => hasPermission(user, permission));
  };
  
  /**
   * Kiểm tra user có tất cả permissions
   */
  export const hasAllPermissions = (user, permissions) => {
    if (!user || !permissions?.length) return false;
    return permissions.every(permission => hasPermission(user, permission));
  };
  
  /**
   * Lấy tất cả permissions của user
   */
  export const getUserPermissions = (user) => {
    if (!user) return [];
    
    const directPermissions = user.permissions || [];
    const rolePermissions = user.role ? (ROLE_PERMISSIONS[user.role] || []) : [];
    
    // Gộp và loại bỏ duplicate
    return [...new Set([...directPermissions, ...rolePermissions])];
  };
  
  /**
   * Kiểm tra role có cao hơn role khác không
   */
  export const isRoleHigher = (role1, role2) => {
    const hierarchy = [
      ROLES.TRAINEE,
      ROLES.CUSTOMER_SERVICE,
      ROLES.SALES_STAFF,
      ROLES.INVENTORY_STAFF,
      ROLES.CASHIER,
      ROLES.SHIFT_SUPERVISOR,
      ROLES.MANAGER,
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN
    ];
    
    const index1 = hierarchy.indexOf(role1);
    const index2 = hierarchy.indexOf(role2);
    
    return index1 > index2;
  };
  
  /**
   * Lấy role cao nhất của user
   */
  export const getHighestRole = (user) => {
    if (!user) return null;
    
    const userRoles = user.roles || [user.role].filter(Boolean);
    if (!userRoles.length) return null;
    
    const hierarchy = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
      ROLES.SHIFT_SUPERVISOR,
      ROLES.CASHIER,
      ROLES.INVENTORY_STAFF,
      ROLES.SALES_STAFF,
      ROLES.CUSTOMER_SERVICE,
      ROLES.TRAINEE
    ];
    
    for (const role of hierarchy) {
      if (userRoles.includes(role)) return role;
    }
    
    return userRoles[0];
  };
  
  // ================================
  // FEATURE FLAGS
  // ================================
  export const FEATURE_FLAGS = {
    GAMIFICATION: 'gamification',
    AI_INSIGHTS: 'ai_insights',
    ADVANCED_ANALYTICS: 'advanced_analytics',
    MULTI_STORE: 'multi_store',
    ECOMMERCE_INTEGRATION: 'ecommerce_integration',
    LOYALTY_PROGRAM: 'loyalty_program',
    INVENTORY_FORECASTING: 'inventory_forecasting',
    PRICE_OPTIMIZATION: 'price_optimization',
    REAL_TIME_SYNC: 'real_time_sync',
    MOBILE_POS: 'mobile_pos'
  };
  
  /**
   * Kiểm tra feature flag được bật không
   */
  export const isFeatureEnabled = (user, feature) => {
    if (!user) return false;
    
    // Kiểm tra trong user settings
    if (user.features?.[feature]) return true;
    
    // Kiểm tra permission cho feature
    if (hasPermission(user, `feature.${feature}`)) return true;
    
    // Kiểm tra global settings (có thể từ API)
    const globalFeatures = user.company?.features || {};
    return globalFeatures[feature] || false;
  };
  
  // ================================
  // BUSINESS RULES
  // ================================
  export const BUSINESS_RULES = {
    // Quy tắc hoàn tiền
    REFUND_RULES: {
      MAX_REFUND_DAYS: 30,
      REQUIRE_RECEIPT: true,
      MANAGER_APPROVAL_ABOVE: 1000000, // 1M VND
    },
    
    // Quy tắc giảm giá
    DISCOUNT_RULES: {
      MAX_DISCOUNT_PERCENT: 50,
      MANAGER_APPROVAL_ABOVE: 30, // 30%
      CASHIER_MAX_DISCOUNT: 10,   // 10%
    },
    
    // Quy tắc tồn kho
    INVENTORY_RULES: {
      LOW_STOCK_THRESHOLD: 10,
      REORDER_POINT: 5,
      REQUIRE_APPROVAL_FOR_NEGATIVE: true,
    },
    
    // Quy tắc ca làm việc
    SHIFT_RULES: {
      MAX_CASH_VARIANCE: 50000, // 50K VND
      REQUIRE_MANAGER_APPROVAL: true,
    }
  };
  
  /**
   * Kiểm tra business rule
   */
  export const checkBusinessRule = (user, rule, value) => {
    // Implement business rule checking logic
    switch (rule) {
      case 'refund_approval':
        return value <= BUSINESS_RULES.REFUND_RULES.MANAGER_APPROVAL_ABOVE || 
               hasAnyRole(user, [ROLES.MANAGER, ROLES.ADMIN]);
      
      case 'discount_approval':
        if (hasRole(user, ROLES.CASHIER)) {
          return value <= BUSINESS_RULES.DISCOUNT_RULES.CASHIER_MAX_DISCOUNT;
        }
        return value <= BUSINESS_RULES.DISCOUNT_RULES.MANAGER_APPROVAL_ABOVE || 
               hasAnyRole(user, [ROLES.MANAGER, ROLES.ADMIN]);
      
      default:
        return true;
    }
  };
  
  export default {
    ROLES,
    ROLE_PERMISSIONS,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    isRoleHigher,
    getHighestRole,
    isFeatureEnabled,
    checkBusinessRule,
    FEATURE_FLAGS,
    BUSINESS_RULES
  };        
      
      STAFF_PERMISSIONS.VIEW_STAFF,
      STAFF_PERMISSIONS.VIEW_PERFORMANCE,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_SALES_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_REAL_TIME_DATA,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS
    ],
  
    [ROLES.CASHIER]: [
      // POS và thanh toán
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      
      ORDER_PERMISSIONS.CREATE_ORDERS,
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.PROCESS_RETURNS,
      ORDER_PERMISSIONS.APPLY_DISCOUNTS,
      ORDER_PERMISSIONS.ACCESS_POS,
      ORDER_PERMISSIONS.OPEN_CASH_DRAWER,
      ORDER_PERMISSIONS.PROCESS_PAYMENTS,
      
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
      CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.UPDATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.MANAGE_LOYALTY,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_REAL_TIME_DATA,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS,
      
      AI_PERMISSIONS.ACCESS_RECOMMENDATIONS
    ],
  
    [ROLES.SALES_STAFF]: [
      // Bán hàng và khách hàng
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      
      ORDER_PERMISSIONS.CREATE_ORDERS,
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.ACCESS_POS,
      ORDER_PERMISSIONS.PROCESS_PAYMENTS,
      
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
      CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.UPDATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMER_HISTORY,
      CUSTOMER_PERMISSIONS.MANAGE_LOYALTY,
      CUSTOMER_PERMISSIONS.SEND_MARKETING,
      CUSTOMER_PERMISSIONS.EXPORT_DATA,

      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_SALES_REPORTS,

      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS,

      AI_PERMISSIONS.ACCESS_RECOMMENDATIONS
    ]
  };