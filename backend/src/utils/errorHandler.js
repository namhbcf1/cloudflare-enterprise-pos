/**
 * Comprehensive Error Handling System for Cloudflare Workers
 * Provides standardized error responses, logging, and monitoring
 */

import { getConfig, isProduction } from '../config/environment.js';

// Error Types
export const ERROR_TYPES = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    DATABASE: 'DATABASE_ERROR',
    EXTERNAL_API: 'EXTERNAL_API_ERROR',
    INTERNAL: 'INTERNAL_SERVER_ERROR',
    BAD_REQUEST: 'BAD_REQUEST_ERROR',
    CONFLICT: 'CONFLICT_ERROR',
    BUSINESS_LOGIC: 'BUSINESS_LOGIC_ERROR'
};

// Error Severity Levels
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
    constructor(message, type = ERROR_TYPES.INTERNAL, statusCode = 500, details = null) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
    
    /**
     * Convert error to JSON
     * @returns {Object} Error object
     */
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * Validation Error Class
 */
export class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, ERROR_TYPES.VALIDATION, 400, details);
        this.name = 'ValidationError';
    }
}

/**
 * Authentication Error Class
 */
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, ERROR_TYPES.AUTHENTICATION, 401);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization Error Class
 */
export class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, ERROR_TYPES.AUTHORIZATION, 403);
        this.name = 'AuthorizationError';
    }
}

/**
 * Not Found Error Class
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, ERROR_TYPES.NOT_FOUND, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Rate Limit Error Class
 */
export class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, ERROR_TYPES.RATE_LIMIT, 429);
        this.name = 'RateLimitError';
    }
}

/**
 * Database Error Class
 */
export class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, ERROR_TYPES.DATABASE, 500);
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

/**
 * Business Logic Error Class
 */
export class BusinessLogicError extends AppError {
    constructor(message, details = null) {
        super(message, ERROR_TYPES.BUSINESS_LOGIC, 422, details);
        this.name = 'BusinessLogicError';
    }
}

/**
 * Error Logger Class
 */
export class ErrorLogger {
    constructor(env) {
        this.env = env;
        this.config = getConfig(env);
    }
    
    /**
     * Log error to console and external services
     * @param {Error} error - Error to log
     * @param {Object} context - Additional context
     */
    async log(error, context = {}) {
        const errorData = {
            timestamp: new Date().toISOString(),
            message: error.message,
            type: error.type || ERROR_TYPES.INTERNAL,
            statusCode: error.statusCode || 500,
            stack: error.stack,
            context: {
                ...context,
                userAgent: context.request?.headers?.get('User-Agent'),
                ip: context.request?.headers?.get('CF-Connecting-IP'),
                url: context.request?.url,
                method: context.request?.method
            }
        };
        
        // Console logging based on environment
        if (this.config.IS_DEVELOPMENT || this.config.LOG_LEVEL === 'debug') {
            console.error('Error Details:', errorData);
        } else {
            console.error(`[${errorData.type}] ${errorData.message}`);
        }
        
        // Log to external services in production
        if (this.config.IS_PRODUCTION && this.config.ERROR_TRACKING_ENABLED) {
            await this.logToExternalService(errorData);
        }
        
        // Store in database for audit trail
        await this.logToDatabase(errorData);
    }
    
    /**
     * Log to external error tracking service
     * @param {Object} errorData - Error data
     */
    async logToExternalService(errorData) {
        try {
            // Example: Send to Sentry, LogRocket, or Cloudflare Analytics
            if (this.env.SENTRY_DSN) {
                // Sentry integration would go here
            }
            
            // Use Cloudflare Analytics if available
            if (this.env.ANALYTICS_TOKEN) {
                await this.sendToCloudflareAnalytics(errorData);
            }
        } catch (loggingError) {
            console.error('Failed to log to external service:', loggingError);
        }
    }
    
    /**
     * Send error to Cloudflare Analytics
     * @param {Object} errorData - Error data
     */
    async sendToCloudflareAnalytics(errorData) {
        try {
            // Cloudflare Web Analytics custom event
            const event = {
                name: 'error_occurred',
                data: {
                    error_type: errorData.type,
                    error_message: errorData.message,
                    status_code: errorData.statusCode,
                    url: errorData.context.url,
                    user_agent: errorData.context.userAgent
                }
            };
            
            // This would integrate with Cloudflare's analytics API
            console.log('Analytics event:', event);
        } catch (analyticsError) {
            console.error('Failed to send to analytics:', analyticsError);
        }
    }
    
    /**
     * Log error to database
     * @param {Object} errorData - Error data
     */
    async logToDatabase(errorData) {
        try {
            if (!this.env.DB) return;
            
            const stmt = this.env.DB.prepare(`
                INSERT INTO audit_logs (
                    action, entity_type, success, error_message, 
                    ip_address, user_agent, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            await stmt.bind(
                'error',
                errorData.type,
                false,
                errorData.message,
                errorData.context.ip,
                errorData.context.userAgent,
                errorData.timestamp
            ).run();
        } catch (dbError) {
            console.error('Failed to log error to database:', dbError);
        }
    }
}

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
    constructor(env) {
        this.env = env;
        this.config = getConfig(env);
        this.startTime = Date.now();
    }
    
    /**
     * Track request performance
     * @param {Object} context - Request context
     */
    trackRequest(context = {}) {
        if (!this.config.PERFORMANCE_MONITORING) return;
        
        const duration = Date.now() - this.startTime;
        const performanceData = {
            timestamp: new Date().toISOString(),
            duration,
            url: context.request?.url,
            method: context.request?.method,
            status: context.response?.status,
            userAgent: context.request?.headers?.get('User-Agent'),
            cfRay: context.request?.headers?.get('CF-Ray'),
            cfCountry: context.request?.headers?.get('CF-IPCountry')
        };
        
        // Log slow requests
        if (duration > 1000) { // Slower than 1 second
            console.warn(`Slow request detected: ${duration}ms`, performanceData);
        }
        
        // Log performance metrics
        if (this.config.IS_DEVELOPMENT) {
            console.log(`Request completed in ${duration}ms`);
        }
        
        return performanceData;
    }
}

/**
 * Create standardized error response
 * @param {Error} error - Error object
 * @param {Request} request - HTTP request
 * @param {Object} env - Environment variables
 * @returns {Response} HTTP response
 */
export function createErrorResponse(error, request = null, env = null) {
    const config = env ? getConfig(env) : { IS_DEVELOPMENT: false };
    const isAppError = error instanceof AppError;
    
    // Default error data
    let errorData = {
        success: false,
        error: {
            type: isAppError ? error.type : ERROR_TYPES.INTERNAL,
            message: isAppError ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        }
    };
    
    // Add details for operational errors
    if (isAppError && error.details) {
        errorData.error.details = error.details;
    }
    
    // Add stack trace in development
    if (config.IS_DEVELOPMENT && error.stack) {
        errorData.error.stack = error.stack;
    }
    
    // Add request ID for tracking
    if (request) {
        const requestId = request.headers.get('CF-Ray') || crypto.randomUUID();
        errorData.error.requestId = requestId;
    }
    
    // Determine status code
    const statusCode = isAppError ? error.statusCode : 500;
    
    // Security headers
    const headers = {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    };
    
    // Add CORS headers if needed
    if (request && env) {
        const origin = request.headers.get('Origin');
        const corsConfig = config.CORS_ALLOWED_ORIGINS;
        
        if (corsConfig.includes(origin) || corsConfig.includes('*')) {
            headers['Access-Control-Allow-Origin'] = origin;
            headers['Access-Control-Allow-Credentials'] = 'true';
        }
    }
    
    return new Response(JSON.stringify(errorData), {
        status: statusCode,
        headers
    });
}

/**
 * Global error handler middleware
 * @param {Function} handler - Request handler
 * @returns {Function} Wrapped handler
 */
export function withErrorHandler(handler) {
    return async (request, env, ctx) => {
        const errorLogger = new ErrorLogger(env);
        const performanceMonitor = new PerformanceMonitor(env);
        
        try {
            const response = await handler(request, env, ctx);
            
            // Track performance
            performanceMonitor.trackRequest({ request, response });
            
            return response;
        } catch (error) {
            // Log error
            await errorLogger.log(error, { request, env, ctx });
            
            // Track performance even for errors
            performanceMonitor.trackRequest({ request });
            
            // Return error response
            return createErrorResponse(error, request, env);
        }
    };
}

/**
 * Async error wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function asyncErrorHandler(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            throw error instanceof AppError ? error : new AppError(error.message);
        }
    };
}

/**
 * Database error handler
 * @param {Error} error - Database error
 * @returns {AppError} Wrapped error
 */
export function handleDatabaseError(error) {
    console.error('Database error:', error);
    
    // Map specific database errors
    if (error.message.includes('UNIQUE constraint failed')) {
        return new ValidationError('Duplicate entry detected');
    }
    
    if (error.message.includes('FOREIGN KEY constraint failed')) {
        return new ValidationError('Invalid reference to related data');
    }
    
    if (error.message.includes('NOT NULL constraint failed')) {
        return new ValidationError('Required field is missing');
    }
    
    // Generic database error
    return new DatabaseError('Database operation failed', error);
}

/**
 * Validation error handler
 * @param {Object} validationResult - Validation result
 * @returns {ValidationError} Validation error
 */
export function handleValidationError(validationResult) {
    if (validationResult.error) {
        const details = validationResult.error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        
        return new ValidationError('Validation failed', details);
    }
    
    return new ValidationError('Invalid input data');
}

/**
 * Rate limit error handler
 * @param {string} identifier - Rate limit identifier
 * @param {number} limit - Rate limit
 * @param {number} window - Time window in seconds
 * @returns {RateLimitError} Rate limit error
 */
export function handleRateLimitError(identifier, limit, window) {
    const message = `Rate limit exceeded. Maximum ${limit} requests per ${window} seconds.`;
    return new RateLimitError(message);
}

/**
 * Error severity classifier
 * @param {Error} error - Error to classify
 * @returns {string} Severity level
 */
export function classifyErrorSeverity(error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return ERROR_SEVERITY.MEDIUM;
    }
    
    if (error instanceof ValidationError || error instanceof NotFoundError) {
        return ERROR_SEVERITY.LOW;
    }
    
    if (error instanceof DatabaseError) {
        return ERROR_SEVERITY.HIGH;
    }
    
    if (error.statusCode >= 500) {
        return ERROR_SEVERITY.CRITICAL;
    }
    
    return ERROR_SEVERITY.LOW;
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
    /**
     * Retry operation with exponential backoff
     * @param {Function} operation - Operation to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} baseDelay - Base delay in milliseconds
     * @returns {Promise} Operation result
     */
    async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Don't retry certain error types
                if (error instanceof ValidationError || 
                    error instanceof AuthenticationError ||
                    error instanceof AuthorizationError) {
                    throw error;
                }
                
                // Exponential backoff
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    },
    
    /**
     * Circuit breaker pattern
     * @param {Function} operation - Operation to protect
     * @param {number} threshold - Failure threshold
     * @param {number} timeout - Circuit timeout in milliseconds
     * @returns {Function} Protected operation
     */
    circuitBreaker(operation, threshold = 5, timeout = 60000) {
        let failures = 0;
        let lastFailTime = null;
        let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        
        return async (...args) => {
            if (state === 'OPEN') {
                if (Date.now() - lastFailTime < timeout) {
                    throw new AppError('Circuit breaker is OPEN');
                } else {
                    state = 'HALF_OPEN';
                }
            }
            
            try {
                const result = await operation(...args);
                
                if (state === 'HALF_OPEN') {
                    state = 'CLOSED';
                    failures = 0;
                }
                
                return result;
            } catch (error) {
                failures++;
                lastFailTime = Date.now();
                
                if (failures >= threshold) {
                    state = 'OPEN';
                }
                
                throw error;
            }
        };
    }
};

// Export all error classes and utilities
export {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    DatabaseError,
    BusinessLogicError,
    ErrorLogger,
    PerformanceMonitor,
    createErrorResponse,
    withErrorHandler,
    asyncErrorHandler,
    handleDatabaseError,
    handleValidationError,
    handleRateLimitError,
    classifyErrorSeverity,
    ERROR_TYPES,
    ERROR_SEVERITY
};