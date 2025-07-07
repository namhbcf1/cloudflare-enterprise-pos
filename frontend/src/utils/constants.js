// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://your-api.your-subdomain.workers.dev' 
      : 'http://localhost:8787',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  };
  
  // Authentication
  export const AUTH_CONFIG = {
    TOKEN_KEY: 'enterprise_pos_token',
    USER_KEY: 'enterprise_pos_user',
    REFRESH_TOKEN_KEY: 'enterprise_pos_refresh_token',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    REMEMBER_ME_DURATION: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  
  // User Roles and Permissions
  export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager', 
    CASHIER: 'cashier',
    STAFF: 'staff'
  };
  
  export const PERMISSIONS = {
    // Product Management
    PRODUCTS_VIEW: 'products:view',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_UPDATE: 'products:update',
    PRODUCTS_DELETE: 'products:delete',
    PRODUCTS_IMPORT: 'products:import',
    
    // Order Management
    ORDERS_VIEW: 'orders:view',
    ORDERS_CREATE: 'orders:create',
    ORDERS_UPDATE: 'orders:update',
    ORDERS_DELETE: 'orders:delete',
    ORDERS_REFUND: 'orders:refund',
    
    // Customer Management
    CUSTOMERS_VIEW: 'customers:view',
    CUSTOMERS_CREATE: 'customers:create',
    CUSTOMERS_UPDATE: 'customers:update',
    CUSTOMERS_DELETE: 'customers:delete',
    
    // Staff Management
    STAFF_VIEW: 'staff:view',
    STAFF_CREATE: 'staff:create',
    STAFF_UPDATE: 'staff:update',
    STAFF_DELETE: 'staff:delete',
    
    // Analytics
    ANALYTICS_VIEW: 'analytics:view',
    ANALYTICS_EXPORT: 'analytics:export',
    
    // Settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_UPDATE: 'settings:update',
    SETTINGS_SYSTEM: 'settings:system'
  };
  
  export const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: [
      // All permissions
      ...Object.values(PERMISSIONS)
    ],
    [USER_ROLES.MANAGER]: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_CREATE,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.ORDERS_REFUND,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_UPDATE,
      PERMISSIONS.STAFF_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.SETTINGS_VIEW
    ],
    [USER_ROLES.CASHIER]: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_CREATE,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_CREATE
    ],
    [USER_ROLES.STAFF]: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW
    ]
  };
  
  // Order Status
  export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  };
  
  export const ORDER_STATUS_COLORS = {
    [ORDER_STATUS.PENDING]: 'orange',
    [ORDER_STATUS.PROCESSING]: 'blue',
    [ORDER_STATUS.COMPLETED]: 'green',
    [ORDER_STATUS.CANCELLED]: 'red',
    [ORDER_STATUS.REFUNDED]: 'purple'
  };
  
  // Payment Methods
  export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    DIGITAL_WALLET: 'digital_wallet',
    BANK_TRANSFER: 'bank_transfer',
    STORE_CREDIT: 'store_credit',
    LOYALTY_POINTS: 'loyalty_points'
  };
  
  export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.CASH]: 'Cash',
    [PAYMENT_METHODS.CARD]: 'Card',
    [PAYMENT_METHODS.DIGITAL_WALLET]: 'Digital Wallet',
    [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
    [PAYMENT_METHODS.STORE_CREDIT]: 'Store Credit',
    [PAYMENT_METHODS.LOYALTY_POINTS]: 'Loyalty Points'
  };
  
  // Product Categories
  export const PRODUCT_CATEGORIES = [
    'Electronics',
    'Clothing',
    'Food & Beverages',
    'Books',
    'Home & Garden',
    'Sports & Outdoors',
    'Health & Beauty',
    'Toys & Games',
    'Automotive',
    'Office Supplies',
    'Pet Supplies',
    'Jewelry',
    'Art & Crafts',
    'Music & Movies',
    'Travel',
    'Other'
  ];
  
  // Stock Status
  export const STOCK_STATUS = {
    IN_STOCK: 'in_stock',
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued'
  };
  
  export const STOCK_STATUS_COLORS = {
    [STOCK_STATUS.IN_STOCK]: 'green',
    [STOCK_STATUS.LOW_STOCK]: 'orange',
    [STOCK_STATUS.OUT_OF_STOCK]: 'red',
    [STOCK_STATUS.DISCONTINUED]: 'gray'
  };
  
  // Staff Gamification
  export const BADGE_TYPES = {
    SALES_CHAMPION: 'sales_champion',
    CUSTOMER_FAVORITE: 'customer_favorite',
    SPEED_DEMON: 'speed_demon',
    PRODUCT_EXPERT: 'product_expert',
    TEAM_PLAYER: 'team_player',
    EARLY_BIRD: 'early_bird',
    NIGHT_OWL: 'night_owl',
    PERFECTIONIST: 'perfectionist'
  };
  
  export const BADGE_CONFIGS = {
    [BADGE_TYPES.SALES_CHAMPION]: {
      name: 'Sales Champion',
      description: 'Top performer in sales',
      icon: '🏆',
      color: '#gold'
    },
    [BADGE_TYPES.CUSTOMER_FAVORITE]: {
      name: 'Customer Favorite',
      description: 'Highest customer satisfaction',
      icon: '⭐',
      color: '#1890ff'
    },
    [BADGE_TYPES.SPEED_DEMON]: {
      name: 'Speed Demon',
      description: 'Fastest transaction processing',
      icon: '⚡',
      color: '#52c41a'
    },
    [BADGE_TYPES.PRODUCT_EXPERT]: {
      name: 'Product Expert',
      description: 'Extensive product knowledge',
      icon: '🧠',
      color: '#722ed1'
    },
    [BADGE_TYPES.TEAM_PLAYER]: {
      name: 'Team Player',
      description: 'Excellent collaboration',
      icon: '🤝',
      color: '#fa541c'
    },
    [BADGE_TYPES.EARLY_BIRD]: {
      name: 'Early Bird',
      description: 'Consistent early arrivals',
      icon: '🌅',
      color: '#faad14'
    },
    [BADGE_TYPES.NIGHT_OWL]: {
      name: 'Night Owl',
      description: 'Late shift excellence',
      icon: '🦉',
      color: '#eb2f96'
    },
    [BADGE_TYPES.PERFECTIONIST]: {
      name: 'Perfectionist',
      description: 'Zero error transactions',
      icon: '💎',
      color: '#13c2c2'
    }
  };
  
  // Analytics Time Periods
  export const TIME_PERIODS = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'this_week',
    LAST_WEEK: 'last_week',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_QUARTER: 'this_quarter',
    LAST_QUARTER: 'last_quarter',
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    CUSTOM: 'custom'
  };
  
  export const TIME_PERIOD_LABELS = {
    [TIME_PERIODS.TODAY]: 'Today',
    [TIME_PERIODS.YESTERDAY]: 'Yesterday',
    [TIME_PERIODS.THIS_WEEK]: 'This Week',
    [TIME_PERIODS.LAST_WEEK]: 'Last Week',
    [TIME_PERIODS.THIS_MONTH]: 'This Month',
    [TIME_PERIODS.LAST_MONTH]: 'Last Month',
    [TIME_PERIODS.THIS_QUARTER]: 'This Quarter',
    [TIME_PERIODS.LAST_QUARTER]: 'Last Quarter',
    [TIME_PERIODS.THIS_YEAR]: 'This Year',
    [TIME_PERIODS.LAST_YEAR]: 'Last Year',
    [TIME_PERIODS.CUSTOM]: 'Custom Range'
  };
  
  // Chart Colors
  export const CHART_COLORS = [
    '#1890ff',
    '#52c41a',
    '#faad14',
    '#f5222d',
    '#722ed1',
    '#fa541c',
    '#13c2c2',
    '#eb2f96',
    '#fa8c16',
    '#a0d911'
  ];
  
  // Notification Types
  export const NOTIFICATION_TYPES = {
    ORDER_CREATED: 'order_created',
    ORDER_COMPLETED: 'order_completed',
    LOW_STOCK: 'low_stock',
    STAFF_ACHIEVEMENT: 'staff_achievement',
    SYSTEM_ALERT: 'system_alert',
    PROMOTION: 'promotion'
  };
  
  // LocalStorage Keys
  export const STORAGE_KEYS = {
    THEME: 'enterprise_pos_theme',
    LANGUAGE: 'enterprise_pos_language',
    SIDEBAR_COLLAPSED: 'enterprise_pos_sidebar_collapsed',
    CART_ITEMS: 'enterprise_pos_cart',
    RECENT_PRODUCTS: 'enterprise_pos_recent_products',
    USER_PREFERENCES: 'enterprise_pos_preferences'
  };
  
  // App Configuration
  export const APP_CONFIG = {
    NAME: 'Enterprise POS',
    VERSION: '1.0.0',
    DESCRIPTION: 'Enterprise Point of Sale System',
    COPYRIGHT: '© 2025 Enterprise POS. All rights reserved.',
    CONTACT_EMAIL: 'support@enterprise-pos.com',
    DOCUMENTATION_URL: 'https://docs.enterprise-pos.com',
    SUPPORT_URL: 'https://support.enterprise-pos.com'
  };
  
  // Feature Flags
  export const FEATURES = {
    AI_RECOMMENDATIONS: true,
    STAFF_GAMIFICATION: true,
    LOYALTY_PROGRAM: true,
    MULTI_STORE: false,
    ADVANCED_ANALYTICS: true,
    INVENTORY_FORECASTING: true,
    REAL_TIME_SYNC: true,
    OFFLINE_MODE: true,
    BARCODE_SCANNING: true,
    RECEIPT_PRINTING: true
  };
  
  // Validation Rules
  export const VALIDATION_RULES = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\+]?[1-9][\d]{0,15}$/,
    SKU: /^[A-Z0-9-_]{3,20}$/,
    BARCODE: /^[0-9]{8,13}$/,
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SPECIAL_CHARS: false
    }
  };
  
  // Date Formats
  export const DATE_FORMATS = {
    DISPLAY: 'MMM DD, YYYY',
    DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
    API: 'YYYY-MM-DD',
    API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
    FILE_NAME: 'YYYY-MM-DD_HH-mm-ss'
  };
  
  // Currency
  export const CURRENCY = {
    SYMBOL: '$',
    CODE: 'USD',
    DECIMAL_PLACES: 2
  };
  
  // Export default configuration
  export default {
    API_CONFIG,
    AUTH_CONFIG,
    USER_ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    ORDER_STATUS,
    PAYMENT_METHODS,
    PRODUCT_CATEGORIES,
    STOCK_STATUS,
    BADGE_TYPES,
    TIME_PERIODS,
    CHART_COLORS,
    NOTIFICATION_TYPES,
    STORAGE_KEYS,
    APP_CONFIG,
    FEATURES,
    VALIDATION_RULES,
    DATE_FORMATS,
    CURRENCY
  };