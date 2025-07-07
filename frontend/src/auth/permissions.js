// frontend/src/utils/permissions.js
/**
 * ENTERPRISE POS PERMISSIONS SYSTEM v2.0.0
 * Hệ thống phân quyền chi tiết và linh hoạt cho Enterprise POS
 */

// ================================
// ĐỊNH NGHĨA ROLES HIERARCHY
// ================================
export const ROLES = {
    SUPER_ADMIN: 'super_admin',        // Siêu quản trị (toàn quyền hệ thống)
    ADMIN: 'admin',                    // Quản trị viên (toàn quyền store)
    MANAGER: 'manager',                // Quản lý (hầu hết quyền operational)
    SHIFT_SUPERVISOR: 'shift_supervisor', // Trưởng ca (quản lý ca làm việc)
    SENIOR_CASHIER: 'senior_cashier',  // Thu ngân chính (quyền cao hơn)
    CASHIER: 'cashier',               // Thu ngân (POS cơ bản)
    SALES_STAFF: 'sales_staff',       // Nhân viên bán hàng
    INVENTORY_STAFF: 'inventory_staff', // Nhân viên kho
    CUSTOMER_SERVICE: 'customer_service', // Chăm sóc khách hàng
    TRAINEE: 'trainee'                // Thực tập sinh
  };
  
  // Role hierarchy (từ cao xuống thấp)
  export const ROLE_HIERARCHY = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.SHIFT_SUPERVISOR,
    ROLES.SENIOR_CASHIER,
    ROLES.INVENTORY_STAFF,
    ROLES.SALES_STAFF,
    ROLES.CASHIER,
    ROLES.CUSTOMER_SERVICE,
    ROLES.TRAINEE
  ];
  
  // ================================
  // ĐỊNH NGHĨA PERMISSIONS CHI TIẾT
  // ================================
  
  // 🔐 Authentication & User Management
  export const AUTH_PERMISSIONS = {
    VIEW_USERS: 'auth.users.view',
    CREATE_USERS: 'auth.users.create',
    UPDATE_USERS: 'auth.users.update',
    DELETE_USERS: 'auth.users.delete',
    RESET_PASSWORD: 'auth.users.reset_password',
    MANAGE_ROLES: 'auth.roles.manage',
    VIEW_AUDIT_LOG: 'auth.audit.view',
    MANAGE_SESSIONS: 'auth.sessions.manage',
    VIEW_LOGIN_HISTORY: 'auth.login_history.view',
    MANAGE_2FA: 'auth.2fa.manage'
  };
  
  // 📦 Products & Inventory Management
  export const PRODUCT_PERMISSIONS = {
    VIEW_PRODUCTS: 'products.view',
    CREATE_PRODUCTS: 'products.create',
    UPDATE_PRODUCTS: 'products.update',
    DELETE_PRODUCTS: 'products.delete',
    MANAGE_CATEGORIES: 'products.categories.manage',
    MANAGE_BRANDS: 'products.brands.manage',
    MANAGE_SUPPLIERS: 'products.suppliers.manage',
    MANAGE_PRICING: 'products.pricing.manage',
    BULK_OPERATIONS: 'products.bulk.manage',
    IMPORT_PRODUCTS: 'products.import',
    EXPORT_PRODUCTS: 'products.export',
    VIEW_COST_PRICE: 'products.cost_price.view',
    
    // Inventory specific
    VIEW_INVENTORY: 'inventory.view',
    UPDATE_INVENTORY: 'inventory.update',
    STOCK_ADJUSTMENT: 'inventory.adjust',
    TRANSFER_STOCK: 'inventory.transfer',
    VIEW_STOCK_MOVEMENTS: 'inventory.movements.view',
    MANAGE_WAREHOUSES: 'inventory.warehouses.manage',
    CYCLE_COUNT: 'inventory.cycle_count',
    LOW_STOCK_ALERTS: 'inventory.alerts.low_stock'
  };
  
  // 🛒 Orders & POS Operations
  export const ORDER_PERMISSIONS = {
    CREATE_ORDERS: 'orders.create',
    VIEW_ORDERS: 'orders.view',
    VIEW_ALL_ORDERS: 'orders.view_all',
    UPDATE_ORDERS: 'orders.update',
    CANCEL_ORDERS: 'orders.cancel',
    PROCESS_RETURNS: 'orders.returns.process',
    PROCESS_EXCHANGES: 'orders.exchanges.process',
    APPLY_DISCOUNTS: 'orders.discounts.apply',
    APPLY_MANUAL_DISCOUNT: 'orders.discounts.manual',
    VOID_TRANSACTIONS: 'orders.void',
    REPRINT_RECEIPTS: 'orders.receipts.reprint',
    
    // POS specific
    ACCESS_POS: 'pos.access',
    OPEN_CASH_DRAWER: 'pos.cash_drawer.open',
    MANUAL_PRICE_OVERRIDE: 'pos.price.override',
    MANUAL_TAX_OVERRIDE: 'pos.tax.override',
    SPLIT_PAYMENTS: 'pos.payments.split',
    LAYAWAY_ORDERS: 'pos.layaway',
    QUOTE_ORDERS: 'pos.quotes',
    
    // Payment specific
    PROCESS_PAYMENTS: 'payments.process',
    PROCESS_REFUNDS: 'payments.refunds.process',
    PROCESS_PARTIAL_REFUNDS: 'payments.refunds.partial',
    CASH_PAYMENTS: 'payments.cash',
    CARD_PAYMENTS: 'payments.card',
    DIGITAL_PAYMENTS: 'payments.digital',
    LOYALTY_PAYMENTS: 'payments.loyalty'
  };
  
  // 👥 Customers & CRM
  export const CUSTOMER_PERMISSIONS = {
    VIEW_CUSTOMERS: 'customers.view',
    CREATE_CUSTOMERS: 'customers.create',
    UPDATE_CUSTOMERS: 'customers.update',
    DELETE_CUSTOMERS: 'customers.delete',
    VIEW_CUSTOMER_HISTORY: 'customers.history.view',
    VIEW_CUSTOMER_ANALYTICS: 'customers.analytics.view',
    MANAGE_LOYALTY: 'customers.loyalty.manage',
    SEND_MARKETING: 'customers.marketing.send',
    EXPORT_DATA: 'customers.data.export',
    IMPORT_CUSTOMERS: 'customers.import',
    MERGE_CUSTOMERS: 'customers.merge',
    VIEW_CUSTOMER_NOTES: 'customers.notes.view',
    MANAGE_CUSTOMER_GROUPS: 'customers.groups.manage'
  };
  
  // 👨‍💼 Staff & Human Resources
  export const STAFF_PERMISSIONS = {
    VIEW_STAFF: 'staff.view',
    CREATE_STAFF: 'staff.create',
    UPDATE_STAFF: 'staff.update',
    DELETE_STAFF: 'staff.delete',
    MANAGE_SCHEDULES: 'staff.schedules.manage',
    VIEW_PERFORMANCE: 'staff.performance.view',
    MANAGE_COMMISSIONS: 'staff.commissions.manage',
    APPROVE_TIME_OFF: 'staff.time_off.approve',
    VIEW_TIMESHEETS: 'staff.timesheets.view',
    MANAGE_DEPARTMENTS: 'staff.departments.manage',
    CONDUCT_REVIEWS: 'staff.reviews.conduct',
    VIEW_SALARY_INFO: 'staff.salary.view'
  };
  
  // 📊 Analytics & Reporting
  export const ANALYTICS_PERMISSIONS = {
    VIEW_DASHBOARD: 'analytics.dashboard.view',
    VIEW_SALES_REPORTS: 'analytics.sales.view',
    VIEW_INVENTORY_REPORTS: 'analytics.inventory.view',
    VIEW_STAFF_REPORTS: 'analytics.staff.view',
    VIEW_CUSTOMER_REPORTS: 'analytics.customers.view',
    VIEW_FINANCIAL_REPORTS: 'analytics.financial.view',
    VIEW_PROFIT_LOSS: 'analytics.profit_loss.view',
    EXPORT_REPORTS: 'analytics.reports.export',
    CREATE_CUSTOM_REPORTS: 'analytics.custom.create',
    VIEW_REAL_TIME_DATA: 'analytics.realtime.view',
    ACCESS_BI_TOOLS: 'analytics.bi.access',
    SCHEDULE_REPORTS: 'analytics.reports.schedule',
    VIEW_FORECASTING: 'analytics.forecasting.view'
  };
  
  // ⚙️ System & Settings
  export const SYSTEM_PERMISSIONS = {
    VIEW_SETTINGS: 'system.settings.view',
    UPDATE_SETTINGS: 'system.settings.update',
    MANAGE_STORES: 'system.stores.manage',
    MANAGE_INTEGRATIONS: 'system.integrations.manage',
    VIEW_SYSTEM_LOGS: 'system.logs.view',
    BACKUP_DATA: 'system.backup.create',
    RESTORE_DATA: 'system.backup.restore',
    MANAGE_TAXES: 'system.taxes.manage',
    MANAGE_PAYMENT_METHODS: 'system.payments.manage',
    MANAGE_PRINTERS: 'system.printers.manage',
    MANAGE_DEVICES: 'system.devices.manage',
    UPDATE_SOFTWARE: 'system.software.update',
    MANAGE_LICENSES: 'system.licenses.manage'
  };
  
  // 🎮 Gamification & Engagement
  export const GAMIFICATION_PERMISSIONS = {
    VIEW_LEADERBOARD: 'gamification.leaderboard.view',
    MANAGE_CHALLENGES: 'gamification.challenges.manage',
    MANAGE_REWARDS: 'gamification.rewards.manage',
    VIEW_ACHIEVEMENTS: 'gamification.achievements.view',
    PARTICIPATE_COMPETITIONS: 'gamification.competitions.participate',
    CREATE_COMPETITIONS: 'gamification.competitions.create',
    MANAGE_BADGES: 'gamification.badges.manage',
    VIEW_TEAM_PERFORMANCE: 'gamification.team.view'
  };
  
  // 🤖 AI & Advanced Features
  export const AI_PERMISSIONS = {
    ACCESS_AI_INSIGHTS: 'ai.insights.access',
    USE_DEMAND_FORECASTING: 'ai.forecasting.use',
    USE_PRICE_OPTIMIZATION: 'ai.pricing.use',
    ACCESS_RECOMMENDATIONS: 'ai.recommendations.access',
    CONFIGURE_AI_SETTINGS: 'ai.settings.configure',
    USE_CHATBOT: 'ai.chatbot.use',
    ACCESS_PREDICTIVE_ANALYTICS: 'ai.predictive.access',
    TRAIN_AI_MODELS: 'ai.models.train'
  };
  
  // 💰 Financial & Accounting
  export const FINANCIAL_PERMISSIONS = {
    VIEW_FINANCIAL_DATA: 'financial.data.view',
    MANAGE_CASH_FLOW: 'financial.cash_flow.manage',
    RECONCILE_ACCOUNTS: 'financial.accounts.reconcile',
    MANAGE_EXPENSES: 'financial.expenses.manage',
    VIEW_PROFIT_MARGINS: 'financial.profit_margins.view',
    GENERATE_INVOICES: 'financial.invoices.generate',
    MANAGE_SUPPLIERS_PAYMENTS: 'financial.suppliers.payments',
    TAX_REPORTING: 'financial.tax.reporting'
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
      ...Object.values(AI_PERMISSIONS),
      ...Object.values(FINANCIAL_PERMISSIONS)
    ],
  
    [ROLES.ADMIN]: [
      // Gần như toàn quyền, trừ một số quyền super admin
      AUTH_PERMISSIONS.VIEW_USERS,
      AUTH_PERMISSIONS.CREATE_USERS,
      AUTH_PERMISSIONS.UPDATE_USERS,
      AUTH_PERMISSIONS.RESET_PASSWORD,
      AUTH_PERMISSIONS.MANAGE_ROLES,
      AUTH_PERMISSIONS.VIEW_AUDIT_LOG,
      AUTH_PERMISSIONS.MANAGE_SESSIONS,
      
      ...Object.values(PRODUCT_PERMISSIONS),
      ...Object.values(ORDER_PERMISSIONS),
      ...Object.values(CUSTOMER_PERMISSIONS),
      ...Object.values(STAFF_PERMISSIONS),
      ...Object.values(ANALYTICS_PERMISSIONS),
      
      SYSTEM_PERMISSIONS.VIEW_SETTINGS,
      SYSTEM_PERMISSIONS.UPDATE_SETTINGS,
      SYSTEM_PERMISSIONS.MANAGE_STORES,
      SYSTEM_PERMISSIONS.MANAGE_INTEGRATIONS,
      SYSTEM_PERMISSIONS.MANAGE_TAXES,
      SYSTEM_PERMISSIONS.MANAGE_PAYMENT_METHODS,
      SYSTEM_PERMISSIONS.MANAGE_PRINTERS,
      SYSTEM_PERMISSIONS.MANAGE_DEVICES,
      
      ...Object.values(GAMIFICATION_PERMISSIONS),
      ...Object.values(AI_PERMISSIONS),
      ...Object.values(FINANCIAL_PERMISSIONS)
    ],
  
    [ROLES.MANAGER]: [
      // Quản lý operational và nhân sự
      AUTH_PERMISSIONS.VIEW_USERS,
      AUTH_PERMISSIONS.VIEW_LOGIN_HISTORY,
      
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.CREATE_PRODUCTS,
      PRODUCT_PERMISSIONS.UPDATE_PRODUCTS,
      PRODUCT_PERMISSIONS.MANAGE_CATEGORIES,
      PRODUCT_PERMISSIONS.MANAGE_BRANDS,
      PRODUCT_PERMISSIONS.MANAGE_SUPPLIERS,
      PRODUCT_PERMISSIONS.MANAGE_PRICING,
      PRODUCT_PERMISSIONS.BULK_OPERATIONS,
      PRODUCT_PERMISSIONS.VIEW_COST_PRICE,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      PRODUCT_PERMISSIONS.UPDATE_INVENTORY,
      PRODUCT_PERMISSIONS.STOCK_ADJUSTMENT,
      PRODUCT_PERMISSIONS.TRANSFER_STOCK,
      PRODUCT_PERMISSIONS.VIEW_STOCK_MOVEMENTS,
      PRODUCT_PERMISSIONS.CYCLE_COUNT,
      PRODUCT_PERMISSIONS.LOW_STOCK_ALERTS,
      
      ...Object.values(ORDER_PERMISSIONS),
      ...Object.values(CUSTOMER_PERMISSIONS),
      
      STAFF_PERMISSIONS.VIEW_STAFF,
      STAFF_PERMISSIONS.CREATE_STAFF,
      STAFF_PERMISSIONS.UPDATE_STAFF,
      STAFF_PERMISSIONS.MANAGE_SCHEDULES,
      STAFF_PERMISSIONS.VIEW_PERFORMANCE,
      STAFF_PERMISSIONS.MANAGE_COMMISSIONS,
      STAFF_PERMISSIONS.APPROVE_TIME_OFF,
      STAFF_PERMISSIONS.VIEW_TIMESHEETS,
      STAFF_PERMISSIONS.CONDUCT_REVIEWS,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_SALES_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_INVENTORY_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_STAFF_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_CUSTOMER_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_FINANCIAL_REPORTS,
      ANALYTICS_PERMISSIONS.EXPORT_REPORTS,
      ANALYTICS_PERMISSIONS.CREATE_CUSTOM_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_REAL_TIME_DATA,
      ANALYTICS_PERMISSIONS.VIEW_FORECASTING,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.MANAGE_CHALLENGES,
      GAMIFICATION_PERMISSIONS.MANAGE_REWARDS,
      GAMIFICATION_PERMISSIONS.CREATE_COMPETITIONS,
      GAMIFICATION_PERMISSIONS.VIEW_TEAM_PERFORMANCE,
      
      AI_PERMISSIONS.ACCESS_AI_INSIGHTS,
      AI_PERMISSIONS.USE_DEMAND_FORECASTING,
      AI_PERMISSIONS.USE_PRICE_OPTIMIZATION,
      AI_PERMISSIONS.ACCESS_RECOMMENDATIONS,
      AI_PERMISSIONS.ACCESS_PREDICTIVE_ANALYTICS,
      
      FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_DATA,
      FINANCIAL_PERMISSIONS.MANAGE_CASH_FLOW,
      FINANCIAL_PERMISSIONS.MANAGE_EXPENSES,
      FINANCIAL_PERMISSIONS.VIEW_PROFIT_MARGINS
    ],
  
    [ROLES.SHIFT_SUPERVISOR]: [
      // Quản lý ca làm việc và POS
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      PRODUCT_PERMISSIONS.LOW_STOCK_ALERTS,
      
      ORDER_PERMISSIONS.CREATE_ORDERS,
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.UPDATE_ORDERS,
      ORDER_PERMISSIONS.CANCEL_ORDERS,
      ORDER_PERMISSIONS.PROCESS_RETURNS,
      ORDER_PERMISSIONS.PROCESS_EXCHANGES,
      ORDER_PERMISSIONS.APPLY_DISCOUNTS,
      ORDER_PERMISSIONS.APPLY_MANUAL_DISCOUNT,
      ORDER_PERMISSIONS.VOID_TRANSACTIONS,
      ORDER_PERMISSIONS.REPRINT_RECEIPTS,
      ORDER_PERMISSIONS.ACCESS_POS,
      ORDER_PERMISSIONS.OPEN_CASH_DRAWER,
      ORDER_PERMISSIONS.MANUAL_PRICE_OVERRIDE,
      ORDER_PERMISSIONS.SPLIT_PAYMENTS,
      ORDER_PERMISSIONS.LAYAWAY_ORDERS,
      ORDER_PERMISSIONS.QUOTE_ORDERS,
      ...Object.values({
        PROCESS_PAYMENTS: ORDER_PERMISSIONS.PROCESS_PAYMENTS,
        PROCESS_REFUNDS: ORDER_PERMISSIONS.PROCESS_REFUNDS,
        CASH_PAYMENTS: ORDER_PERMISSIONS.CASH_PAYMENTS,
        CARD_PAYMENTS: ORDER_PERMISSIONS.CARD_PAYMENTS,
        DIGITAL_PAYMENTS: ORDER_PERMISSIONS.DIGITAL_PAYMENTS,
        LOYALTY_PAYMENTS: ORDER_PERMISSIONS.LOYALTY_PAYMENTS
      }),
      
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
      CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.UPDATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMER_HISTORY,
      CUSTOMER_PERMISSIONS.MANAGE_LOYALTY,
      
      STAFF_PERMISSIONS.VIEW_STAFF,
      STAFF_PERMISSIONS.VIEW_PERFORMANCE,
      STAFF_PERMISSIONS.VIEW_TIMESHEETS,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_SALES_REPORTS,
      ANALYTICS_PERMISSIONS.VIEW_REAL_TIME_DATA,
      
      GAMIFICATION_PERMISSIONS.VIEW_LEADERBOARD,
      GAMIFICATION_PERMISSIONS.VIEW_ACHIEVEMENTS,
      GAMIFICATION_PERMISSIONS.PARTICIPATE_COMPETITIONS,
      
      AI_PERMISSIONS.ACCESS_RECOMMENDATIONS,
      
      FINANCIAL_PERMISSIONS.VIEW_FINANCIAL_DATA
    ],
  
    [ROLES.SENIOR_CASHIER]: [
      // Thu ngân với quyền cao hơn
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      
      ORDER_PERMISSIONS.CREATE_ORDERS,
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.PROCESS_RETURNS,
      ORDER_PERMISSIONS.PROCESS_EXCHANGES,
      ORDER_PERMISSIONS.APPLY_DISCOUNTS,
      ORDER_PERMISSIONS.REPRINT_RECEIPTS,
      ORDER_PERMISSIONS.ACCESS_POS,
      ORDER_PERMISSIONS.OPEN_CASH_DRAWER,
      ORDER_PERMISSIONS.SPLIT_PAYMENTS,
      ORDER_PERMISSIONS.LAYAWAY_ORDERS,
      ORDER_PERMISSIONS.PROCESS_PAYMENTS,
      ORDER_PERMISSIONS.PROCESS_REFUNDS,
      ORDER_PERMISSIONS.CASH_PAYMENTS,
      ORDER_PERMISSIONS.CARD_PAYMENTS,
      ORDER_PERMISSIONS.DIGITAL_PAYMENTS,
      ORDER_PERMISSIONS.LOYALTY_PAYMENTS,
      
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
  
    [ROLES.CASHIER]: [
      // POS và thanh toán cơ bản
      PRODUCT_PERMISSIONS.VIEW_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      
      ORDER_PERMISSIONS.CREATE_ORDERS,
      ORDER_PERMISSIONS.VIEW_ORDERS,
      ORDER_PERMISSIONS.PROCESS_RETURNS,
      ORDER_PERMISSIONS.ACCESS_POS,
      ORDER_PERMISSIONS.PROCESS_PAYMENTS,
      ORDER_PERMISSIONS.CASH_PAYMENTS,
      ORDER_PERMISSIONS.CARD_PAYMENTS,
      ORDER_PERMISSIONS.DIGITAL_PAYMENTS,
      ORDER_PERMISSIONS.LOYALTY_PAYMENTS,
      
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
      ORDER_PERMISSIONS.QUOTE_ORDERS,
      
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMERS,
      CUSTOMER_PERMISSIONS.CREATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.UPDATE_CUSTOMERS,
      CUSTOMER_PERMISSIONS.VIEW_CUSTOMER_HISTORY,
      CUSTOMER_PERMISSIONS.MANAGE_LOYALTY,
      CUSTOMER_PERMISSIONS.SEND_MARKETING,
      
      ANALYTICS_PERMISSIONS.VIEW_DASHBOARD,
      ANALYTICS_PERMISSIONS.VIEW_SALES_REPORTS,
      
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
      PRODUCT_PERMISSIONS.MANAGE_CATEGORIES,
      PRODUCT_PERMISSIONS.MANAGE_SUPPLIERS,
      PRODUCT_PERMISSIONS.BULK_OPERATIONS,
      PRODUCT_PERMISSIONS.IMPORT_PRODUCTS,
      PRODUCT_PERMISSIONS.VIEW_INVENTORY,
      PRODUCT_PERMISSIONS.UPDATE_INVENTORY,
      PRODUCT_PERMISSIONS.STOCK_ADJUSTMENT,
      PRODUCT_PERMISSIONS.TRANSFER_STOCK,
      PRODUCT_PERMISSIONS.VIEW_STOCK_MOVEMENTS,
      PRODUCT_PERMISSIONS.CYCLE_COUNT,
      PRODUCT_PERMISSIONS.LOW_STOCK_ALERTS,
      
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
      ORDER_PERMISSIONS.PROCESS_EXCHANGES,
      
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
    if (!user || !role) return false;
    if (Array.isArray(user.roles)) {
      return user.roles.includes(role);
    }
    return user.role === role;
  };
  
  /**
   * Kiểm tra user có ít nhất 1 trong các roles
   */
  export const hasAnyRole = (user, roles) => {
    if (!user || !Array.isArray(roles)) return false;
    return roles.some(role => hasRole(user, role));
  };
  
  /**
   * Kiểm tra user có tất cả roles
   */
  export const hasAllRoles = (user, roles) => {
    if (!user || !Array.isArray(roles)) return false;
    return roles.every(role => hasRole(user, role));
  };
  
  /**
   * Kiểm tra user có permission không
   */
  export const hasPermission = (user, permission) => {
    if (!user || !permission) return false;
    
    // Kiểm tra permission trực tiếp
    if (user.permissions?.includes(permission)) return true;
    
    // Kiểm tra permission thông qua role
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
    
    return userRoles.some(role => {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      return rolePermissions.includes(permission);
    });
  };
  
  /**
   * Kiểm tra user có ít nhất 1 permission
   */
  export const hasAnyPermission = (user, permissions) => {
    if (!user || !Array.isArray(permissions)) return false;
    return permissions.some(permission => hasPermission(user, permission));
  };
  
  /**
   * Kiểm tra user có tất cả permissions
   */
  export const hasAllPermissions = (user, permissions) => {
    if (!user || !Array.isArray(permissions)) return false;
    return permissions.every(permission => hasPermission(user, permission));
  };
  
  /**
   * Lấy tất cả permissions của user
   */
  export const getUserPermissions = (user) => {
    if (!user) return [];
    
    const directPermissions = user.permissions || [];
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
    
    const rolePermissions = userRoles.reduce((acc, role) => {
      const permissions = ROLE_PERMISSIONS[role] || [];
      return [...acc, ...permissions];
    }, []);
    
    // Gộp và loại bỏ duplicate
    return [...new Set([...directPermissions, ...rolePermissions])];
  };
  
  /**
   * Kiểm tra role có cao hơn role khác không
   */
  export const isRoleHigher = (role1, role2) => {
    const index1 = ROLE_HIERARCHY.indexOf(role1);
    const index2 = ROLE_HIERARCHY.indexOf(role2);
    
    // Index thấp hơn = role cao hơn
    return index1 !== -1 && index2 !== -1 && index1 < index2;
  };
  
  /**
   * Lấy role cao nhất của user
   */
  export const getHighestRole = (user) => {
    if (!user) return null;
    
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);
    if (!userRoles.length) return null;
    
    for (const role of ROLE_HIERARCHY) {
      if (userRoles.includes(role)) return role;
    }
    
    return userRoles[0];
  };
  
  /**
   * Lấy role level (số)
   */
  export const getRoleLevel = (role) => {
    const index = ROLE_HIERARCHY.indexOf(role);
    return index !== -1 ? ROLE_HIERARCHY.length - index : 0;
  };
  
  /**
   * So sánh level giữa 2 users
   */
  export const compareUserLevels = (user1, user2) => {
    const role1 = getHighestRole(user1);
    const role2 = getHighestRole(user2);
    const level1 = getRoleLevel(role1);
    const level2 = getRoleLevel(role2);
    
    return level1 - level2; // > 0 nếu user1 cao hơn, < 0 nếu thấp hơn, = 0 nếu bằng
  };
  
  // ================================
  // FEATURE FLAGS SYSTEM
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
    MOBILE_POS: 'mobile_pos',
    VOICE_COMMANDS: 'voice_commands',
    AR_FEATURES: 'ar_features',
    BLOCKCHAIN_RECEIPT: 'blockchain_receipt',
    SOCIAL_SELLING: 'social_selling'
  };
  
  /**
   * Kiểm tra feature flag được bật không
   */
  export const isFeatureEnabled = (user, feature) => {
    if (!user || !feature) return false;
    
    // Kiểm tra trong user settings
    if (user.features?.[feature]) return true;
    
    // Kiểm tra permission cho feature
    if (hasPermission(user, `feature.${feature}`)) return true;
    
    // Kiểm tra role-based features
    const roleFeatures = getRoleFeatures(getHighestRole(user));
    if (roleFeatures.includes(feature)) return true;
    
    // Kiểm tra global settings
    const globalFeatures = user.company?.features || {};
    return globalFeatures[feature] || false;
  };
  
  /**
   * Lấy features theo role
   */
  const getRoleFeatures = (role) => {
    const roleFeatureMap = {
      [ROLES.SUPER_ADMIN]: Object.values(FEATURE_FLAGS),
      [ROLES.ADMIN]: Object.values(FEATURE_FLAGS),
      [ROLES.MANAGER]: [
        FEATURE_FLAGS.GAMIFICATION,
        FEATURE_FLAGS.AI_INSIGHTS,
        FEATURE_FLAGS.ADVANCED_ANALYTICS,
        FEATURE_FLAGS.LOYALTY_PROGRAM,
        FEATURE_FLAGS.INVENTORY_FORECASTING,
        FEATURE_FLAGS.PRICE_OPTIMIZATION,
        FEATURE_FLAGS.REAL_TIME_SYNC
      ],
      [ROLES.SHIFT_SUPERVISOR]: [
        FEATURE_FLAGS.GAMIFICATION,
        FEATURE_FLAGS.LOYALTY_PROGRAM,
        FEATURE_FLAGS.REAL_TIME_SYNC,
        FEATURE_FLAGS.MOBILE_POS
      ],
      [ROLES.SENIOR_CASHIER]: [
        FEATURE_FLAGS.GAMIFICATION,
        FEATURE_FLAGS.LOYALTY_PROGRAM,
        FEATURE_FLAGS.MOBILE_POS
      ],
      [ROLES.CASHIER]: [
        FEATURE_FLAGS.GAMIFICATION,
        FEATURE_FLAGS.LOYALTY_PROGRAM
      ]
    };
    
    return roleFeatureMap[role] || [];
  };
  
  // ================================
  // BUSINESS RULES ENGINE
  // ================================
  export const BUSINESS_RULES = {
    // Quy tắc hoàn tiền
    REFUND_RULES: {
      MAX_REFUND_DAYS: 30,
      REQUIRE_RECEIPT: true,
      MANAGER_APPROVAL_ABOVE: 1000000, // 1M VND
      SUPERVISOR_APPROVAL_ABOVE: 500000, // 500K VND
      FULL_REFUND_DAYS: 7,
      PARTIAL_REFUND_ONLY_AFTER: 14
    },
    
    // Quy tắc giảm giá
    DISCOUNT_RULES: {
      MAX_DISCOUNT_PERCENT: 50,
      MANAGER_APPROVAL_ABOVE: 30, // 30%
      SUPERVISOR_APPROVAL_ABOVE: 20, // 20%
      SENIOR_CASHIER_MAX: 15, // 15%
      CASHIER_MAX_DISCOUNT: 10, // 10%
      TRAINEE_MAX_DISCOUNT: 5, // 5%
      BULK_DISCOUNT_MIN_QTY: 10,
      VIP_ADDITIONAL_DISCOUNT: 5 // 5% thêm cho VIP
    },
    
    // Quy tắc tồn kho
    INVENTORY_RULES: {
      LOW_STOCK_THRESHOLD: 10,
      CRITICAL_STOCK_THRESHOLD: 5,
      REORDER_POINT: 15,
      MAX_STOCK_ADJUSTMENT: 1000,
      REQUIRE_APPROVAL_FOR_NEGATIVE: true,
      AUTO_REORDER_ENABLED: true,
      CYCLE_COUNT_FREQUENCY: 30 // days
    },
    
    // Quy tắc ca làm việc
    SHIFT_RULES: {
      MAX_CASH_VARIANCE: 50000, // 50K VND
      REQUIRE_MANAGER_APPROVAL: true,
      MAX_SHIFT_HOURS: 12,
      MIN_BREAK_TIME: 60, // minutes
      OVERTIME_THRESHOLD: 8, // hours
      MAX_CONSECUTIVE_DAYS: 6
    },
    
    // Quy tắc khách hàng
    CUSTOMER_RULES: {
      VIP_SPENDING_THRESHOLD: 10000000, // 10M VND
      LOYALTY_POINTS_RATIO: 100, // 1 point per 100 VND
      POINTS_EXPIRY_DAYS: 365,
      BIRTHDAY_DISCOUNT: 10, // 10%
      REFERRAL_BONUS: 50000, // 50K VND
      MAX_CREDIT_LIMIT: 5000000 // 5M VND
    },
    
    // Quy tắc nhân viên
    STAFF_RULES: {
      BASE_COMMISSION_RATE: 2, // 2%
      VIP_COMMISSION_BONUS: 1, // 1% additional
      MONTHLY_TARGET_BONUS: 500000, // 500K VND
      ATTENDANCE_BONUS: 200000, // 200K VND
      PERFORMANCE_REVIEW_FREQUENCY: 90, // days
      MAX_ABSENCE_DAYS: 5
    }
  };
  
  /**
   * Kiểm tra business rule
   */
  export const checkBusinessRule = (user, rule, value, context = {}) => {
    const userRole = getHighestRole(user);
    
    switch (rule) {
      case 'refund_approval':
        if (value <= BUSINESS_RULES.REFUND_RULES.SUPERVISOR_APPROVAL_ABOVE) {
          return hasAnyRole(user, [ROLES.SHIFT_SUPERVISOR, ROLES.SENIOR_CASHIER, ROLES.MANAGER, ROLES.ADMIN]);
        }
        return hasAnyRole(user, [ROLES.MANAGER, ROLES.ADMIN]);
        
      case 'discount_approval':
        const maxDiscount = getMaxDiscountForRole(userRole);
        if (value <= maxDiscount) return true;
        
        if (value <= BUSINESS_RULES.DISCOUNT_RULES.SUPERVISOR_APPROVAL_ABOVE) {
          return hasAnyRole(user, [ROLES.SHIFT_SUPERVISOR, ROLES.MANAGER, ROLES.ADMIN]);
        }
        return hasAnyRole(user, [ROLES.MANAGER, ROLES.ADMIN]);
        
      case 'stock_adjustment':
        if (Math.abs(value) <= BUSINESS_RULES.INVENTORY_RULES.MAX_STOCK_ADJUSTMENT) {
          return hasPermission(user, PRODUCT_PERMISSIONS.STOCK_ADJUSTMENT);
        }
        return hasAnyRole(user, [ROLES.MANAGER, ROLES.ADMIN]);
        
      case 'void_transaction':
        const amount = context.amount || 0;
        if (amount <= 100000) { // 100K VND
          return hasPermission(user, ORDER_PERMISSIONS.VOID_TRANSACTIONS);
        }
        return hasAnyRole(user, [ROLES.SHIFT_SUPERVISOR, ROLES.MANAGER, ROLES.ADMIN]);
        
      case 'cash_variance':
        return Math.abs(value) <= BUSINESS_RULES.SHIFT_RULES.MAX_CASH_VARIANCE;
        
      default:
        return true;
    }
  };
  
  /**
   * Lấy mức giảm giá tối đa theo role
   */
  const getMaxDiscountForRole = (role) => {
    const discountMap = {
      [ROLES.SUPER_ADMIN]: BUSINESS_RULES.DISCOUNT_RULES.MAX_DISCOUNT_PERCENT,
      [ROLES.ADMIN]: BUSINESS_RULES.DISCOUNT_RULES.MAX_DISCOUNT_PERCENT,
      [ROLES.MANAGER]: BUSINESS_RULES.DISCOUNT_RULES.MANAGER_APPROVAL_ABOVE,
      [ROLES.SHIFT_SUPERVISOR]: BUSINESS_RULES.DISCOUNT_RULES.SUPERVISOR_APPROVAL_ABOVE,
      [ROLES.SENIOR_CASHIER]: BUSINESS_RULES.DISCOUNT_RULES.SENIOR_CASHIER_MAX,
      [ROLES.CASHIER]: BUSINESS_RULES.DISCOUNT_RULES.CASHIER_MAX_DISCOUNT,
      [ROLES.TRAINEE]: BUSINESS_RULES.DISCOUNT_RULES.TRAINEE_MAX_DISCOUNT
    };
    
    return discountMap[role] || 0;
  };
  
  /**
   * Validate business rules for operation
   */
  export const validateOperation = (user, operation, data) => {
    const violations = [];
    
    switch (operation) {
      case 'create_order':
        // Validate discount
        if (data.discount > 0) {
          if (!checkBusinessRule(user, 'discount_approval', data.discount)) {
            violations.push({
              rule: 'discount_approval',
              message: `Giảm giá ${data.discount}% vượt quá quyền hạn`
            });
          }
        }
        break;
        
      case 'process_refund':
        if (!checkBusinessRule(user, 'refund_approval', data.amount)) {
          violations.push({
            rule: 'refund_approval',
            message: `Hoàn tiền ${data.amount.toLocaleString()}₫ cần phê duyệt`
          });
        }
        break;
        
      case 'adjust_inventory':
        if (!checkBusinessRule(user, 'stock_adjustment', data.quantity)) {
          violations.push({
            rule: 'stock_adjustment',
            message: `Điều chỉnh ${Math.abs(data.quantity)} sản phẩm vượt quyền hạn`
          });
        }
        break;
    }
    
    return {
      isValid: violations.length === 0,
      violations
    };
  };
  
  // ================================
  // PERMISSION CONTEXT SYSTEM
  // ================================
  
  /**
   * Create permission context for component
   */
  export const createPermissionContext = (user, requiredPermissions = [], requiredRoles = []) => {
    return {
      user,
      hasRequiredPermissions: hasAllPermissions(user, requiredPermissions),
      hasRequiredRoles: hasAnyRole(user, requiredRoles),
      canAccess: hasAllPermissions(user, requiredPermissions) || hasAnyRole(user, requiredRoles),
      userPermissions: getUserPermissions(user),
      userRole: getHighestRole(user),
      userLevel: getRoleLevel(getHighestRole(user))
    };
  };
  
  /**
   * Permission-based component wrapper
   */
  export const withPermissions = (requiredPermissions = [], requiredRoles = []) => {
    return (WrappedComponent) => {
      return function PermissionWrappedComponent(props) {
        const { user, fallback = null, ...otherProps } = props;
        const context = createPermissionContext(user, requiredPermissions, requiredRoles);
        
        if (!context.canAccess) {
          return fallback;
        }
        
        return <WrappedComponent {...otherProps} permissionContext={context} />;
      };
    };
  };
  
  // Export tất cả
  export default {
    ROLES,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS,
    FEATURE_FLAGS,
    BUSINESS_RULES,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    isRoleHigher,
    getHighestRole,
    getRoleLevel,
    compareUserLevels,
    isFeatureEnabled,
    checkBusinessRule,
    validateOperation,
    createPermissionContext,
    withPermissions
  };