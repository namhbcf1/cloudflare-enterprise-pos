-- Cloudflare D1 Database Migration: Authentication Tables
-- Migration: 001_auth_tables.sql
-- Description: Create core authentication and user management tables

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'cashier', 'staff')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    last_activity DATETIME,
    login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    preferences TEXT DEFAULT '{}', -- JSON stored as text
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    updated_by TEXT
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    invalidated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email verification tokens table
CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit logs table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- User roles and permissions (for future expansion)
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    permissions TEXT NOT NULL DEFAULT '[]', -- JSON array
    is_system BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User role assignments (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_by TEXT,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- Insert default system roles
INSERT OR IGNORE INTO roles (id, name, display_name, description, permissions, is_system) VALUES
('admin', 'admin', 'Administrator', 'Full system access', '["all"]', TRUE),
('manager', 'manager', 'Manager', 'Store management access', '["manage_inventory", "view_reports", "manage_staff", "process_transactions"]', TRUE),
('cashier', 'cashier', 'Cashier', 'Point of sale access', '["process_transactions", "view_inventory", "manage_customers"]', TRUE),
('staff', 'staff', 'Staff', 'Basic system access', '["view_inventory", "basic_reports"]', TRUE);

-- Create default admin user (password: Admin123!)
-- Note: In production, this should be changed immediately
INSERT OR IGNORE INTO users (
    id, 
    email, 
    username, 
    password_hash, 
    full_name, 
    role, 
    status,
    email_verified,
    created_at
) VALUES (
    'admin-001',
    'admin@cloudflarepos.com',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfCOXhJxwwL8PrC', -- Admin123!
    'System Administrator',
    'admin',
    'active',
    TRUE,
    CURRENT_TIMESTAMP
);

-- Business settings table for POS configuration
CREATE TABLE IF NOT EXISTS business_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    category TEXT DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_business_settings_key ON business_settings(key);
CREATE INDEX IF NOT EXISTS idx_business_settings_category ON business_settings(category);

-- Insert default business settings
INSERT OR IGNORE INTO business_settings (key, value, data_type, category, description, is_public) VALUES
('business_name', 'Cloudflare Enterprise POS', 'string', 'business', 'Business name', TRUE),
('business_email', 'contact@cloudflarepos.com', 'string', 'business', 'Business contact email', TRUE),
('business_phone', '', 'string', 'business', 'Business phone number', TRUE),
('business_address', '', 'string', 'business', 'Business address', TRUE),
('currency', 'VND', 'string', 'pos', 'Default currency', TRUE),
('tax_rate', '10', 'number', 'pos', 'Default tax rate percentage', TRUE),
('receipt_footer', 'Thank you for your business!', 'string', 'pos', 'Receipt footer message', TRUE),
('allow_discount', 'true', 'boolean', 'pos', 'Allow staff to apply discounts', FALSE),
('max_discount_percent', '50', 'number', 'pos', 'Maximum discount percentage', FALSE),
('auto_print_receipt', 'true', 'boolean', 'pos', 'Auto print receipts', FALSE),
('low_stock_threshold', '10', 'number', 'inventory', 'Low stock alert threshold', FALSE),
('session_timeout', '480', 'number', 'security', 'Session timeout in minutes', FALSE),
('max_login_attempts', '5', 'number', 'security', 'Maximum login attempts before lockout', FALSE),
('lockout_duration', '30', 'number', 'security', 'Account lockout duration in minutes', FALSE);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_business_settings_updated_at
    AFTER UPDATE ON business_settings
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE business_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create trigger for audit logging
CREATE TRIGGER IF NOT EXISTS trigger_users_audit_log
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (
        NEW.updated_by,
        'update',
        'user',
        NEW.id,
        json_object(
            'email', OLD.email,
            'username', OLD.username,
            'full_name', OLD.full_name,
            'role', OLD.role,
            'status', OLD.status
        ),
        json_object(
            'email', NEW.email,
            'username', NEW.username,
            'full_name', NEW.full_name,
            'role', NEW.role,
            'status', NEW.status
        )
    );
END;

-- Views for common queries
CREATE VIEW IF NOT EXISTS active_users AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.full_name,
    u.role,
    u.last_login,
    u.last_activity,
    u.created_at,
    COUNT(s.id) as active_sessions
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id 
    AND s.is_active = TRUE 
    AND s.expires_at > CURRENT_TIMESTAMP
WHERE u.status = 'active'
GROUP BY u.id, u.email, u.username, u.full_name, u.role, u.last_login, u.last_activity, u.created_at;

CREATE VIEW IF NOT EXISTS recent_activity AS
SELECT 
    u.username,
    u.full_name,
    al.action,
    al.entity_type,
    al.success,
    al.created_at
FROM audit_logs al
JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 100;

-- Function to clean up expired tokens and sessions (to be called periodically)
-- Note: SQLite doesn't support stored procedures, so this would be implemented in the application layer

-- Migration completion log
INSERT OR IGNORE INTO audit_logs (action, entity_type, success, created_at) 
VALUES ('migration', 'database', TRUE, CURRENT_TIMESTAMP);

-- Add version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY NOT NULL,
    description TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('001', 'Initial authentication and user management tables');