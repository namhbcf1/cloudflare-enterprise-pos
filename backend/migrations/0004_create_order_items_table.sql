-- ============================================================================
-- MIGRATION 0004: CREATE CUSTOMERS TABLE
-- Created: 2024-01-01
-- Description: Customer management with loyalty program support
-- ============================================================================

-- Customers table with comprehensive customer management
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Customer identification
    customer_code TEXT UNIQUE NOT NULL,
    customer_type TEXT DEFAULT 'individual' CHECK(customer_type IN ('individual', 'business', 'corporate')),
    
    -- Personal information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    middle_name TEXT,
    title TEXT, -- Mr, Mrs, Dr, etc.
    gender TEXT CHECK(gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    date_of_birth DATE,
    
    -- Contact information
    email TEXT,
    phone TEXT,
    mobile TEXT,
    
    -- Address information
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'US',
    
    -- Business information (for business customers)
    company_name TEXT,
    tax_id TEXT,
    business_type TEXT,
    industry TEXT,
    website TEXT,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 0, -- days
    
    -- Loyalty program
    loyalty_member BOOLEAN DEFAULT FALSE,
    loyalty_tier TEXT DEFAULT 'bronze' CHECK(loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    loyalty_points INTEGER DEFAULT 0,
    loyalty_points_lifetime INTEGER DEFAULT 0,
    membership_number TEXT UNIQUE,
    membership_start_date DATE,
    membership_expiry_date DATE,
    
    -- Purchase history & analytics
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    average_order_value DECIMAL(10,2) DEFAULT 0.00,
    last_order_date DATETIME,
    last_order_amount DECIMAL(10,2) DEFAULT 0.00,
    first_order_date DATETIME,
    
    -- Customer behavior
    preferred_payment_method TEXT,
    preferred_contact_method TEXT DEFAULT 'email' CHECK(preferred_contact_method IN ('email', 'phone', 'sms', 'mail')),
    shopping_preferences JSON DEFAULT '{}',
    favorite_categories JSON DEFAULT '[]',
    favorite_products JSON DEFAULT '[]',
    
    -- Marketing & communication
    email_subscribed BOOLEAN DEFAULT TRUE,
    sms_subscribed BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    newsletter_subscribed BOOLEAN DEFAULT FALSE,
    birthday_offers BOOLEAN DEFAULT TRUE,
    
    -- Segmentation & targeting
    customer_segment TEXT,
    acquisition_channel TEXT,
    referral_source TEXT,
    lifetime_value DECIMAL(10,2) DEFAULT 0.00,
    churn_risk_score DECIMAL(3,2) DEFAULT 0.00,
    engagement_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Social & referrals
    referral_code TEXT UNIQUE,
    referred_by INTEGER,
    total_referrals INTEGER DEFAULT 0,
    social_profiles JSON DEFAULT '{}',
    
    -- Notes & custom fields
    notes TEXT,
    internal_notes TEXT,
    tags JSON DEFAULT '[]',
    custom_fields JSON DEFAULT '{}',
    
    -- Special dates
    anniversary_date DATE,
    last_contact_date DATETIME,
    next_follow_up_date DATE,
    
    -- Credit & financial
    credit_balance DECIMAL(10,2) DEFAULT 0.00,
    outstanding_balance DECIMAL(10,2) DEFAULT 0.00,
    credit_rating TEXT,
    payment_history_score DECIMAL(3,2) DEFAULT 1.00,
    
    -- Privacy & GDPR
    data_processing_consent BOOLEAN DEFAULT FALSE,
    data_retention_expiry DATE,
    gdpr_consent_date DATETIME,
    cookie_consent BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Soft delete
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- Foreign key constraints
    FOREIGN KEY (referred_by) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Performance indexes
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_name ON customers(first_name, last_name);
CREATE INDEX idx_customers_company ON customers(company_name);
CREATE INDEX idx_customers_membership ON customers(membership_number);
CREATE INDEX idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX idx_customers_segment ON customers(customer_segment);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_verified ON customers(is_verified);
CREATE INDEX idx_customers_loyalty_member ON customers(loyalty_member);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX idx_customers_last_order ON customers(last_order_date);
CREATE INDEX idx_customers_birthday ON customers(date_of_birth);

-- Composite indexes for common queries
CREATE INDEX idx_customers_active_tier ON customers(is_active, loyalty_tier);
CREATE INDEX idx_customers_tier_points ON customers(loyalty_tier, loyalty_points);
CREATE INDEX idx_customers_segment_active ON customers(customer_segment, is_active);
CREATE INDEX idx_customers_city_state ON customers(city, state);
CREATE INDEX idx_customers_total_spent ON customers(total_spent, is_active);
CREATE INDEX idx_customers_acquisition_channel ON customers(acquisition_channel);

-- Full-text search index for customer search
CREATE VIRTUAL TABLE customers_fts USING fts5(
    first_name,
    last_name,
    company_name,
    email,
    phone,
    mobile,
    customer_code,
    membership_number,
    content='customers',
    content_rowid='id'
);

-- Triggers for FTS index
CREATE TRIGGER customers_fts_insert AFTER INSERT ON customers BEGIN
    INSERT INTO customers_fts(rowid, first_name, last_name, company_name, email, phone, mobile, customer_code, membership_number)
    VALUES (new.id, new.first_name, new.last_name, new.company_name, new.email, new.phone, new.mobile, new.customer_code, new.membership_number);
END;

CREATE TRIGGER customers_fts_delete AFTER DELETE ON customers BEGIN
    INSERT INTO customers_fts(customers_fts, rowid, first_name, last_name, company_name, email, phone, mobile, customer_code, membership_number)
    VALUES ('delete', old.id, old.first_name, old.last_name, old.company_name, old.email, old.phone, old.mobile, old.customer_code, old.membership_number);
END;

CREATE TRIGGER customers_fts_update AFTER UPDATE ON customers BEGIN
    INSERT INTO customers_fts(customers_fts, rowid, first_name, last_name, company_name, email, phone, mobile, customer_code, membership_number)
    VALUES ('delete', old.id, old.first_name, old.last_name, old.company_name, old.email, old.phone, old.mobile, old.customer_code, old.membership_number);
    INSERT INTO customers_fts(rowid, first_name, last_name, company_name, email, phone, mobile, customer_code, membership_number)
    VALUES (new.id, new.first_name, new.last_name, new.company_name, new.email, new.phone, new.mobile, new.customer_code, new.membership_number);
END;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_customers_timestamp 
    AFTER UPDATE ON customers
    FOR EACH ROW
    BEGIN
        UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger to auto-generate customer code
CREATE TRIGGER generate_customer_code
    AFTER INSERT ON customers
    FOR EACH ROW
    WHEN NEW.customer_code IS NULL
    BEGIN
        UPDATE customers 
        SET customer_code = 'CUST' || printf('%06d', NEW.id)
        WHERE id = NEW.id;
    END;

-- Trigger to auto-generate membership number for loyalty members
CREATE TRIGGER generate_membership_number
    AFTER UPDATE OF loyalty_member ON customers
    FOR EACH ROW
    WHEN NEW.loyalty_member = TRUE AND NEW.membership_number IS NULL
    BEGIN
        UPDATE customers 
        SET membership_number = 'MEM' || printf('%08d', NEW.id),
            membership_start_date = DATE('now')
        WHERE id = NEW.id;
    END;

-- Trigger to calculate average order value
CREATE TRIGGER calculate_average_order_value
    AFTER UPDATE OF total_orders, total_spent ON customers
    FOR EACH ROW
    WHEN NEW.total_orders > 0
    BEGIN
        UPDATE customers 
        SET average_order_value = NEW.total_spent / NEW.total_orders
        WHERE id = NEW.id;
    END;

-- Trigger to update referral count
CREATE TRIGGER update_referral_count
    AFTER INSERT ON customers
    FOR EACH ROW
    WHEN NEW.referred_by IS NOT NULL
    BEGIN
        UPDATE customers 
        SET total_referrals = total_referrals + 1
        WHERE id = NEW.referred_by;
    END;