/**
 * Environment Configuration for Cloudflare Workers
 * Manages environment variables, constants, and configuration settings
 */

// Environment Types
export const ENV_TYPES = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production'
};

// Default Configuration
const DEFAULT_CONFIG = {
    // JWT Configuration
    JWT_EXPIRY: '24h',
    JWT_REFRESH_EXPIRY: '7d',
    JWT_ALGORITHM: 'HS256',
    
    // Security Configuration
    BCRYPT_SALT_ROUNDS: 12,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30, // minutes
    SESSION_TIMEOUT: 8 * 60, // 8 hours in minutes
    PASSWORD_MIN_LENGTH: 8,
    
    // Rate Limiting
    RATE_LIMIT_LOGIN: 5, // attempts per minute
    RATE_LIMIT_API: 100, // requests per minute
    RATE_LIMIT_WINDOW: 60, // seconds
    
    // CORS Settings
    CORS_ALLOWED_ORIGINS: ['http://localhost:3000', 'http://localhost:5173'],
    CORS_ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    CORS_MAX_AGE: 86400, // 24 hours
    
    // Database Configuration
    DB_CONNECTION_TIMEOUT: 30000, // 30 seconds
    DB_MAX_RETRIES: 3,
    DB_RETRY_DELAY: 1000, // 1 second
    
    // Cache Configuration
    CACHE_TTL: {
        USER_SESSION: 3600, // 1 hour
        USER_PROFILE: 1800, // 30 minutes
        BUSINESS_SETTINGS: 7200, // 2 hours
        RATE_LIMIT: 300, // 5 minutes
        API_RESPONSE: 600 // 10 minutes
    },
    
    // File Upload Configuration
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    UPLOAD_PATH: '/uploads',
    
    // Business Logic
    DEFAULT_CURRENCY: 'VND',
    DEFAULT_TAX_RATE: 10, // percentage
    DEFAULT_DISCOUNT_LIMIT: 50, // percentage
    LOW_STOCK_THRESHOLD: 10,
    
    // Notification Settings
    EMAIL_ENABLED: false,
    SMS_ENABLED: false,
    PUSH_NOTIFICATIONS_ENABLED: true,
    
    // Analytics and Logging
    LOG_LEVEL: 'info',
    ANALYTICS_ENABLED: true,
    ERROR_TRACKING_ENABLED: true,
    PERFORMANCE_MONITORING: true,
    
    // Feature Flags
    FEATURES: {
        USER_REGISTRATION: true,
        FORGOT_PASSWORD: true,
        TWO_FACTOR_AUTH: false,
        MULTI_LOCATION: false,
        ADVANCED_REPORTING: true,
        INVENTORY_TRACKING: true,
        CUSTOMER_LOYALTY: true,
        STAFF_GAMIFICATION: true,
        AI_FEATURES: true
    }
};

/**
 * Get environment type
 * @param {Object} env - Environment variables
 * @returns {string} Environment type
 */
export function getEnvironmentType(env) {
    const envType = env.ENVIRONMENT || env.NODE_ENV || 'development';
    return Object.values(ENV_TYPES).includes(envType) ? envType : ENV_TYPES.DEVELOPMENT;
}

/**
 * Check if current environment is production
 * @param {Object} env - Environment variables
 * @returns {boolean} Is production environment
 */
export function isProduction(env) {
    return getEnvironmentType(env) === ENV_TYPES.PRODUCTION;
}

/**
 * Check if current environment is development
 * @param {Object} env - Environment variables
 * @returns {boolean} Is development environment
 */
export function isDevelopment(env) {
    return getEnvironmentType(env) === ENV_TYPES.DEVELOPMENT;
}

/**
 * Validate required environment variables
 * @param {Object} env - Environment variables
 * @returns {Object} Validation result
 */
export function validateEnvironment(env) {
    const required = [
        'JWT_SECRET',
        'DB', // D1 Database binding
    ];
    
    const optional = [
        'KV_CACHE', // KV Store for caching
        'R2_STORAGE', // R2 for file storage
        'AI', // Cloudflare AI binding
        'RATE_LIMIT_KV', // KV for rate limiting
        'EMAIL_API_KEY',
        'SMS_API_KEY',
        'ANALYTICS_TOKEN'
    ];
    
    const missing = required.filter(key => !env[key]);
    const warnings = optional.filter(key => !env[key]);
    
    return {
        isValid: missing.length === 0,
        missing,
        warnings,
        message: missing.length > 0 
            ? `Missing required environment variables: ${missing.join(', ')}` 
            : 'Environment validation passed'
    };
}

/**
 * Get configuration with environment overrides
 * @param {Object} env - Environment variables
 * @returns {Object} Complete configuration
 */
export function getConfig(env) {
    const envType = getEnvironmentType(env);
    const isProd = isProduction(env);
    
    // Base configuration
    let config = { ...DEFAULT_CONFIG };
    
    // Environment-specific overrides
    if (envType === ENV_TYPES.DEVELOPMENT) {
        config = {
            ...config,
            LOG_LEVEL: 'debug',
            BCRYPT_SALT_ROUNDS: 8, // Faster for development
            CORS_ALLOWED_ORIGINS: [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://localhost:8080',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5173'
            ]
        };
    } else if (envType === ENV_TYPES.PRODUCTION) {
        config = {
            ...config,
            LOG_LEVEL: 'warn',
            CORS_ALLOWED_ORIGINS: env.ALLOWED_ORIGINS 
                ? env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
                : ['https://your-app.pages.dev']
        };
    }
    
    // Apply environment variable overrides
    const envOverrides = {
        JWT_SECRET: env.JWT_SECRET,
        JWT_EXPIRY: env.JWT_EXPIRY || config.JWT_EXPIRY,
        JWT_REFRESH_EXPIRY: env.JWT_REFRESH_EXPIRY || config.JWT_REFRESH_EXPIRY,
        
        MAX_LOGIN_ATTEMPTS: parseInt(env.MAX_LOGIN_ATTEMPTS) || config.MAX_LOGIN_ATTEMPTS,
        LOCKOUT_DURATION: parseInt(env.LOCKOUT_DURATION) || config.LOCKOUT_DURATION,
        SESSION_TIMEOUT: parseInt(env.SESSION_TIMEOUT) || config.SESSION_TIMEOUT,
        
        RATE_LIMIT_LOGIN: parseInt(env.RATE_LIMIT_LOGIN) || config.RATE_LIMIT_LOGIN,
        RATE_LIMIT_API: parseInt(env.RATE_LIMIT_API) || config.RATE_LIMIT_API,
        
        DEFAULT_CURRENCY: env.DEFAULT_CURRENCY || config.DEFAULT_CURRENCY,
        DEFAULT_TAX_RATE: parseFloat(env.DEFAULT_TAX_RATE) || config.DEFAULT_TAX_RATE,
        
        LOG_LEVEL: env.LOG_LEVEL || config.LOG_LEVEL,
        
        // Feature flags from environment
        FEATURES: {
            ...config.FEATURES,
            USER_REGISTRATION: env.FEATURE_USER_REGISTRATION !== 'false',
            FORGOT_PASSWORD: env.FEATURE_FORGOT_PASSWORD !== 'false',
            TWO_FACTOR_AUTH: env.FEATURE_TWO_FACTOR_AUTH === 'true',
            MULTI_LOCATION: env.FEATURE_MULTI_LOCATION === 'true',
            AI_FEATURES: env.FEATURE_AI_FEATURES !== 'false'
        }
    };
    
    // Merge configuration
    config = { ...config, ...envOverrides };
    
    // Add computed values
    config.IS_PRODUCTION = isProd;
    config.IS_DEVELOPMENT = isDevelopment(env);
    config.ENVIRONMENT = envType;
    config.VERSION = env.VERSION || '1.0.0';
    config.BUILD_TIME = env.BUILD_TIME || new Date().toISOString();
    
    return config;
}

/**
 * Get database configuration
 * @param {Object} env - Environment variables
 * @returns {Object} Database configuration
 */
export function getDatabaseConfig(env) {
    return {
        database: env.DB,
        connectionTimeout: parseInt(env.DB_CONNECTION_TIMEOUT) || DEFAULT_CONFIG.DB_CONNECTION_TIMEOUT,
        maxRetries: parseInt(env.DB_MAX_RETRIES) || DEFAULT_CONFIG.DB_MAX_RETRIES,
        retryDelay: parseInt(env.DB_RETRY_DELAY) || DEFAULT_CONFIG.DB_RETRY_DELAY,
        enableWAL: env.DB_ENABLE_WAL !== 'false', // Write-Ahead Logging
        enableForeignKeys: env.DB_ENABLE_FOREIGN_KEYS !== 'false'
    };
}

/**
 * Get cache configuration
 * @param {Object} env - Environment variables
 * @returns {Object} Cache configuration
 */
export function getCacheConfig(env) {
    return {
        kvStore: env.KV_CACHE,
        enabled: !!env.KV_CACHE,
        defaultTTL: parseInt(env.CACHE_DEFAULT_TTL) || 3600,
        ttl: {
            ...DEFAULT_CONFIG.CACHE_TTL,
            USER_SESSION: parseInt(env.CACHE_TTL_USER_SESSION) || DEFAULT_CONFIG.CACHE_TTL.USER_SESSION,
            USER_PROFILE: parseInt(env.CACHE_TTL_USER_PROFILE) || DEFAULT_CONFIG.CACHE_TTL.USER_PROFILE,
            BUSINESS_SETTINGS: parseInt(env.CACHE_TTL_BUSINESS_SETTINGS) || DEFAULT_CONFIG.CACHE_TTL.BUSINESS_SETTINGS
        }
    };
}

/**
 * Get CORS configuration
 * @param {Object} env - Environment variables
 * @returns {Object} CORS configuration
 */
export function getCorsConfig(env) {
    const config = getConfig(env);
    
    return {
        allowedOrigins: config.CORS_ALLOWED_ORIGINS,
        allowedMethods: config.CORS_ALLOWED_METHODS,
        allowedHeaders: config.CORS_ALLOWED_HEADERS,
        maxAge: config.CORS_MAX_AGE,
        credentials: true
    };
}

/**
 * Get security configuration
 * @param {Object} env - Environment variables
 * @returns {Object} Security configuration
 */
export function getSecurityConfig(env) {
    const config = getConfig(env);
    
    return {
        jwt: {
            secret: config.JWT_SECRET,
            algorithm: config.JWT_ALGORITHM,
            accessTokenExpiry: config.JWT_EXPIRY,
            refreshTokenExpiry: config.JWT_REFRESH_EXPIRY
        },
        password: {
            minLength: config.PASSWORD_MIN_LENGTH,
            saltRounds: config.BCRYPT_SALT_ROUNDS,
            requireUppercase: env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
            requireLowercase: env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
            requireNumbers: env.PASSWORD_REQUIRE_NUMBERS !== 'false',
            requireSpecialChars: env.PASSWORD_REQUIRE_SPECIAL_CHARS !== 'false'
        },
        rateLimit: {
            login: config.RATE_LIMIT_LOGIN,
            api: config.RATE_LIMIT_API,
            window: config.RATE_LIMIT_WINDOW
        },
        session: {
            timeout: config.SESSION_TIMEOUT,
            maxLoginAttempts: config.MAX_LOGIN_ATTEMPTS,
            lockoutDuration: config.LOCKOUT_DURATION
        }
    };
}

/**
 * Configuration validator class
 */
export class ConfigValidator {
    constructor(env) {
        this.env = env;
        this.config = getConfig(env);
        this.errors = [];
        this.warnings = [];
    }
    
    /**
     * Validate JWT configuration
     */
    validateJWT() {
        if (!this.env.JWT_SECRET) {
            this.errors.push('JWT_SECRET is required');
        } else if (this.env.JWT_SECRET.length < 32) {
            this.warnings.push('JWT_SECRET should be at least 32 characters long');
        }
        
        return this;
    }
    
    /**
     * Validate database configuration
     */
    validateDatabase() {
        if (!this.env.DB) {
            this.errors.push('DB (D1 Database binding) is required');
        }
        
        return this;
    }
    
    /**
     * Validate security settings
     */
    validateSecurity() {
        if (this.config.MAX_LOGIN_ATTEMPTS < 3) {
            this.warnings.push('MAX_LOGIN_ATTEMPTS should be at least 3');
        }
        
        if (this.config.PASSWORD_MIN_LENGTH < 8) {
            this.warnings.push('PASSWORD_MIN_LENGTH should be at least 8');
        }
        
        if (isProduction(this.env) && this.config.LOG_LEVEL === 'debug') {
            this.warnings.push('LOG_LEVEL should not be debug in production');
        }
        
        return this;
    }
    
    /**
     * Get validation result
     * @returns {Object} Validation result
     */
    getResult() {
        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            config: this.config
        };
    }
    
    /**
     * Validate all configuration
     * @returns {Object} Complete validation result
     */
    validateAll() {
        return this
            .validateJWT()
            .validateDatabase()
            .validateSecurity()
            .getResult();
    }
}

/**
 * Create configuration middleware
 * @param {Object} env - Environment variables
 * @returns {Function} Middleware function
 */
export function createConfigMiddleware(env) {
    const validation = validateEnvironment(env);
    
    if (!validation.isValid) {
        throw new Error(validation.message);
    }
    
    const config = getConfig(env);
    
    return (request, envVars, ctx) => {
        // Attach configuration to context
        ctx.config = config;
        ctx.env = envVars;
        
        // Log warnings in development
        if (isDevelopment(env) && validation.warnings.length > 0) {
            console.warn('Environment warnings:', validation.warnings);
        }
        
        return { config, env: envVars };
    };
}

/**
 * Export environment utilities
 */
export const Environment = {
    getConfig,
    validateEnvironment,
    getEnvironmentType,
    isProduction,
    isDevelopment,
    getDatabaseConfig,
    getCacheConfig,
    getCorsConfig,
    getSecurityConfig,
    ConfigValidator,
    createConfigMiddleware,
    ENV_TYPES,
    DEFAULT_CONFIG
};

export default Environment;