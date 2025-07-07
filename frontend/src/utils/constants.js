/**
 * ENTERPRISE POS SYSTEM CONSTANTS
 * Các hằng số và cấu hình cho hệ thống POS
 */

// ================================
// API CONFIGURATION
// ================================
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://your-worker.your-subdomain.workers.dev',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    
    // Products
    PRODUCTS: '/api/products',
    PRODUCT_CATEGORIES: '/api/products/categories',
    PRODUCT_SEARCH: '/api/products/search',
    PRODUCT_BARCODE: '/api/products/barcode',
    
    // Orders
    ORDERS: '/api/orders',
    ORDER_PROCESS: '/api/orders/process',
    ORDER_VOID: '/api/orders/void',
    ORDER_REFUND: '/api/orders/refund',
    
    // Customers
    CUSTOMERS: '/api/customers',
    CUSTOMER_LOYALTY: '/api/customers/loyalty',
    CUSTOMER_HISTORY: '/api/customers/history',
    
    // Staff & HR
    STAFF: '/api/staff',
    STAFF_PERFORMANCE: '/api/staff/performance',
    STAFF_GAMIFICATION: '/api/staff/gamification',
    STAFF_SCHEDULE: '/api/staff/schedule',
    
    // Analytics
    ANALYTICS: '/api/analytics',
    REPORTS: '/api/analytics/reports',
    DASHBOARD: '/api/analytics/dashboard',
    
    // AI Services
    AI_RECOMMENDATIONS: '/api/ai/recommendations',
    AI_FORECASTING: '/api/ai/forecasting',
    AI_PRICING: '/api/ai/pricing',
    
    // System
    SETTINGS: '/api/settings',
    INTEGRATIONS: '/api/integrations',
    WEBSOCKET: '/ws'
  }
};

// ================================
// ROLE DEFINITIONS
// ================================
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SHIFT_SUPERVISOR: 'shift_supervisor',
  CASHIER: 'cashier',
  SALES_STAFF: 'sales_staff',
  INVENTORY_STAFF: 'inventory_staff',
  CUSTOMER_SERVICE: 'customer_service',
  TRAINEE: 'trainee'
};

export const ROLE_HIERARCHY = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.SHIFT_SUPERVISOR,
  USER_ROLES.CASHIER,
  USER_ROLES.SALES_STAFF,
  USER_ROLES.INVENTORY_STAFF,
  USER_ROLES.CUSTOMER_SERVICE,
  USER_ROLES.TRAINEE
];

export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.SUPER_ADMIN]: 'Siêu Quản Trị',
  [USER_ROLES.ADMIN]: 'Quản Trị Viên',
  [USER_ROLES.MANAGER]: 'Quản Lý',
  [USER_ROLES.SHIFT_SUPERVISOR]: 'Trưởng Ca',
  [USER_ROLES.CASHIER]: 'Thu Ngân',
  [USER_ROLES.SALES_STAFF]: 'Nhân Viên Bán Hàng',
  [USER_ROLES.INVENTORY_STAFF]: 'Nhân Viên Kho',
  [USER_ROLES.CUSTOMER_SERVICE]: 'Chăm Sóc Khách Hàng',
  [USER_ROLES.TRAINEE]: 'Thực Tập Sinh'
};

// ================================
// POS CONSTANTS
// ================================
export const POS_CONFIG = {
  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    CARD: 'card',
    MOBILE: 'mobile',
    TRANSFER: 'transfer',
    LOYALTY_POINTS: 'loyalty_points',
    VOUCHER: 'voucher'
  },
  
  // Order status
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    PARTIAL_REFUND: 'partial_refund'
  },
  
  // Transaction types
  TRANSACTION_TYPES: {
    SALE: 'sale',
    REFUND: 'refund',
    VOID: 'void',
    NO_SALE: 'no_sale',
    CASH_IN: 'cash_in',
    CASH_OUT: 'cash_out'
  },
  
  // Discount types
  DISCOUNT_TYPES: {
    PERCENTAGE: 'percentage',
    FIXED_AMOUNT: 'fixed_amount',
    BUY_X_GET_Y: 'buy_x_get_y',
    LOYALTY_DISCOUNT: 'loyalty_discount'
  }
};

export const PAYMENT_METHOD_LABELS = {
  [POS_CONFIG.PAYMENT_METHODS.CASH]: 'Tiền mặt',
  [POS_CONFIG.PAYMENT_METHODS.CARD]: 'Thẻ tín dụng/ghi nợ',
  [POS_CONFIG.PAYMENT_METHODS.MOBILE]: 'Ví điện tử',
  [POS_CONFIG.PAYMENT_METHODS.TRANSFER]: 'Chuyển khoản',
  [POS_CONFIG.PAYMENT_METHODS.LOYALTY_POINTS]: 'Điểm tích lũy',
  [POS_CONFIG.PAYMENT_METHODS.VOUCHER]: 'Phiếu quà tặng'
};

// ================================
// PRODUCT CONSTANTS
// ================================
export const PRODUCT_CONFIG = {
  // Product status
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DISCONTINUED: 'discontinued',
    OUT_OF_STOCK: 'out_of_stock'
  },
  
  // Product types
  TYPES: {
    SIMPLE: 'simple',
    VARIABLE: 'variable',
    BUNDLE: 'bundle',
    DIGITAL: 'digital',
    SERVICE: 'service'
  },
  
  // Tax classes
  TAX_CLASSES: {
    STANDARD: 'standard',
    REDUCED: 'reduced',
    ZERO: 'zero',
    EXEMPT: 'exempt'
  },
  
  // Stock status
  STOCK_STATUS: {
    IN_STOCK: 'in_stock',
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
    BACKORDER: 'backorder'
  }
};

// ================================
// GAMIFICATION CONSTANTS
// ================================
export const GAMIFICATION_CONFIG = {
  // Achievement types
  ACHIEVEMENT_TYPES: {
    SALES_MILESTONE: 'sales_milestone',
    CUSTOMER_SERVICE: 'customer_service',
    PERFECT_ATTENDANCE: 'perfect_attendance',
    TRAINING_COMPLETION: 'training_completion',
    TEAM_COLLABORATION: 'team_collaboration',
    SPECIAL_EVENT: 'special_event'
  },
  
  // Badge rarity
  BADGE_RARITY: {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
  },
  
  // Challenge types
  CHALLENGE_TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    SEASONAL: 'seasonal',
    SPECIAL: 'special'
  },
  
  // Point multipliers
  POINT_MULTIPLIERS: {
    SALE_COMPLETED: 10,
    CUSTOMER_FEEDBACK: 25,
    UPSELL_SUCCESS: 15,
    PERFECT_DAY: 100,
    TRAINING_COMPLETED: 50
  }
};

// ================================
// UI CONSTANTS
// ================================
export const UI_CONFIG = {
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
    MAX_PAGE_SIZE: 100
  },
  
  // Date formats
  DATE_FORMATS: {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd/MM/yyyy HH:mm:ss',
    TIME_ONLY: 'HH:mm:ss',
    MONTH_YEAR: 'MM/yyyy'
  },
  
  // Currency format
  CURRENCY: {
    CODE: 'VND',
    SYMBOL: '₫',
    LOCALE: 'vi-VN',
    DECIMAL_PLACES: 0
  },
  
  // Theme colors
  THEME_COLORS: {
    PRIMARY: '#4F46E5',
    SECONDARY: '#10B981',
    SUCCESS: '#059669',
    WARNING: '#D97706',
    ERROR: '#DC2626',
    INFO: '#2563EB'
  },
  
  // Animation durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  }
};

// ================================
// VALIDATION RULES
// ================================
export const VALIDATION_RULES = {
  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: false
  },
  
  // Product validation
  PRODUCT: {
    NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 1000,
    SKU_MAX_LENGTH: 50,
    BARCODE_MAX_LENGTH: 50,
    MIN_PRICE: 0,
    MAX_PRICE: 999999999
  },
  
  // Customer validation
  CUSTOMER: {
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PHONE_MAX_LENGTH: 20,
    ADDRESS_MAX_LENGTH: 500
  },
  
  // Order validation
  ORDER: {
    MIN_ITEMS: 1,
    MAX_ITEMS: 100,
    MAX_DISCOUNT_PERCENT: 100,
    MIN_TOTAL: 0
  }
};

// ================================
// BUSINESS RULES
// ================================
export const BUSINESS_RULES = {
  // Refund rules
  REFUNDS: {
    ALLOWED_DAYS: 30,
    REQUIRE_RECEIPT: true,
    MANAGER_APPROVAL_THRESHOLD: 1000000, // 1M VND
    RESTOCKING_FEE_PERCENT: 0
  },
  
  // Discount rules
  DISCOUNTS: {
    MAX_EMPLOYEE_DISCOUNT: 10, // 10%
    MAX_MANAGER_DISCOUNT: 50,  // 50%
    REQUIRE_REASON_ABOVE: 20,  // 20%
    LOYALTY_DISCOUNT_MAX: 15   // 15%
  },
  
  // Inventory rules
  INVENTORY: {
    LOW_STOCK_THRESHOLD: 10,
    CRITICAL_STOCK_THRESHOLD: 5,
    AUTO_REORDER_ENABLED: true,
    SAFETY_STOCK_DAYS: 7
  },
  
  // Cash management
  CASH_MANAGEMENT: {
    MAX_CASH_DRAWER: 5000000, // 5M VND
    VARIANCE_THRESHOLD: 50000, // 50K VND
    REQUIRE_MANAGER_APPROVAL: true,
    FLOAT_AMOUNT: 500000 // 500K VND
  },
  
  // Working hours
  WORKING_HOURS: {
    SHIFT_MIN_HOURS: 4,
    SHIFT_MAX_HOURS: 12,
    BREAK_DURATION: 30, // minutes
    OVERTIME_THRESHOLD: 8 // hours
  }
};

// ================================
// NOTIFICATION TYPES
// ================================
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  
  // System notifications
  SYSTEM_UPDATE: 'system_update',
  BACKUP_COMPLETE: 'backup_complete',
  SYNC_ERROR: 'sync_error',
  
  // Business notifications
  LOW_STOCK: 'low_stock',
  NEW_ORDER: 'new_order',
  SHIFT_END_REMINDER: 'shift_end_reminder',
  TARGET_ACHIEVED: 'target_achieved',
  
  // Gamification notifications
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEVEL_UP: 'level_up',
  CHALLENGE_COMPLETED: 'challenge_completed',
  LEADERBOARD_UPDATE: 'leaderboard_update'
};

// ================================
// LOCAL STORAGE KEYS
// ================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  USER_PREFERENCES: 'userPreferences',
  CART_DATA: 'cartData',
  OFFLINE_ORDERS: 'offlineOrders',
  LAST_SYNC: 'lastSync',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed'
};

// ================================
// ERROR CODES
// ================================
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Business logic errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_DISCOUNT: 'INVALID_DISCOUNT',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // System errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND'
};

// ================================
// WEBSOCKET EVENTS
// ================================
export const WEBSOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  RECONNECT: 'reconnect',
  
  // Real-time updates
  ORDER_UPDATE: 'order_update',
  INVENTORY_UPDATE: 'inventory_update',
  STAFF_UPDATE: 'staff_update',
  CUSTOMER_UPDATE: 'customer_update',
  
  // Notifications
  NOTIFICATION: 'notification',
  BROADCAST: 'broadcast',
  
  // System events
  SYSTEM_MAINTENANCE: 'system_maintenance',
  FORCE_LOGOUT: 'force_logout'
};

// ================================
// FEATURE FLAGS
// ================================
export const FEATURE_FLAGS = {
  GAMIFICATION: 'gamification',
  AI_RECOMMENDATIONS: 'ai_recommendations',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  MULTI_STORE: 'multi_store',
  ECOMMERCE_SYNC: 'ecommerce_sync',
  LOYALTY_PROGRAM: 'loyalty_program',
  MOBILE_POS: 'mobile_pos',
  VOICE_COMMANDS: 'voice_commands',
  FACIAL_RECOGNITION: 'facial_recognition',
  BLOCKCHAIN_RECEIPTS: 'blockchain_receipts'
};

// ================================
// DEFAULT VALUES
// ================================
export const DEFAULT_VALUES = {
  CURRENCY: 'VND',
  LANGUAGE: 'vi',
  TIMEZONE: 'Asia/Ho_Chi_Minh',
  DATE_FORMAT: 'dd/MM/yyyy',
  PAGE_SIZE: 20,
  THEME: 'light',
  NOTIFICATION_DURATION: 5000
};

// ================================
// EXPORT ALL
// ================================
export default {
  API_CONFIG,
  USER_ROLES,
  ROLE_HIERARCHY,
  ROLE_DISPLAY_NAMES,
  POS_CONFIG,
  PAYMENT_METHOD_LABELS,
  PRODUCT_CONFIG,
  GAMIFICATION_CONFIG,
  UI_CONFIG,
  VALIDATION_RULES,
  BUSINESS_RULES,
  NOTIFICATION_TYPES,
  STORAGE_KEYS,
  ERROR_CODES,
  WEBSOCKET_EVENTS,
  FEATURE_FLAGS,
  DEFAULT_VALUES
};