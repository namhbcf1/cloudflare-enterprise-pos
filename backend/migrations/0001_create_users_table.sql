-- ============================================================================
-- MIGRATION 0001: CREATE USERS TABLE
-- Created: 2024-01-01
-- Description: Main users table with role-based access control
-- ============================================================================

-- Users table with comprehensive fields for enterprise POS
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Authentication fields
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Personal information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Role and permissions
    role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'staff')) DEFAULT 'staff',
    permissions JSON DEFAULT '[]',
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Contact information
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    emergency_contact TEXT,
    emergency_phone TEXT,
    
    -- Profile
    avatar_url TEXT,
    bio TEXT,
    
    -- Employment information
    employee_id TEXT UNIQUE,
    hire_date DATE,
    department TEXT,
    position TEXT,
    salary DECIMAL(10,2),
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    hourly_rate DECIMAL(8,2),
    
    -- Security
    last_login DATETIME,
    last_login_ip TEXT,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    password_reset_token TEXT,
    password_reset_expires DATETIME,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    
    -- Preferences
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSON DEFAULT '{"email": true, "push": true, "sms": false}',
    
    -- Gamification
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    total_sales DECIMAL(12,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Soft delete
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- Foreign key constraints
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_hire_date ON users(hire_date);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Composite indexes for common queries
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_users_active_created ON users(is_active, created_at);
CREATE INDEX idx_users_role_department ON users(role, department);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;