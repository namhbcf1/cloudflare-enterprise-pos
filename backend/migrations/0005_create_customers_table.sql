-- ============================================================================
-- MIGRATION 0005: CREATE ORDERS TABLE
-- Created: 2024-01-01
-- Description: Orders table for POS transactions and sales management
-- ============================================================================

-- Orders table with comprehensive transaction management
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Order identification
    order_number TEXT UNIQUE NOT NULL,
    invoice_number TEXT UNIQUE,
    receipt_number TEXT UNIQUE,
    reference_number TEXT,
    
    -- Customer information
    customer_id INTEGER,
    customer_name TEXT, -- For walk-in customers without account
    customer_email TEXT,
    customer_phone TEXT,
    
    -- Staff and terminal information
    cashier_id INTEGER NOT NULL,
    shift_id INTEGER,
    terminal_id TEXT,
    location_id INTEGER,
    
    -- Order status and type
    status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'partially_refunded', 'on_hold', 'draft')),
    order_type TEXT DEFAULT 'pos' CHECK(order_type IN ('pos', 'online', 'phone', 'delivery', 'pickup', 'layaway')),
    
    -- Financial information
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    shipping_cost DECIMAL(8,2) DEFAULT 0.00,
    handling_fee DECIMAL(8,2) DEFAULT 0.00,
    service_charge DECIMAL(8,2) DEFAULT 0.00,
    tip_amount DECIMAL(8,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment information
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'digital_wallet', 'bank_transfer', 'check', 'store_credit', 'gift_card', 'layaway', 'mixed')),
    payment_status TEXT DEFAULT 'paid' CHECK(payment_status IN ('pending', 'paid', 'partial', 'failed', 'refunded', 'overpaid')),
    cash_received DECIMAL(10,2) DEFAULT 0.00,
    change_given DECIMAL(10,2) DEFAULT 0.00,
    card_last_four TEXT,
    transaction_id TEXT,
    payment_reference TEXT,
    
    -- Loyalty and rewards
    loyalty_points_earned INTEGER DEFAULT 0,
    loyalty_points_redeemed INTEGER DEFAULT 0,
    loyalty_discount_amount DECIMAL(8,2) DEFAULT 0.00,
    
    -- Discounts and promotions
    coupon_code TEXT,
    promotion_id INTEGER,
    staff_discount BOOLEAN DEFAULT FALSE,
    staff_discount_amount DECIMAL(8,2) DEFAULT 0.00,
    volume_discount DECIMAL(8,2) DEFAULT 0.00,
    
    -- Customer information for receipt
    billing_address JSON DEFAULT '{}',
    shipping_address JSON DEFAULT '{}',
    
    -- Order metadata
    notes TEXT,
    internal_notes TEXT,
    special_instructions TEXT,
    gift_message TEXT,
    
    -- Fulfillment information
    fulfillment_status TEXT DEFAULT 'fulfilled' CHECK(fulfillment_status IN ('pending', 'processing', 'fulfilled', 'shipped', 'delivered', 'pickup_ready', 'picked_up', 'cancelled')),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    delivery_method TEXT,
    tracking_number TEXT,
    
    -- Receipt and printing
    receipt_printed BOOLEAN DEFAULT FALSE,
    receipt_email_sent BOOLEAN DEFAULT FALSE,
    receipt_data JSON DEFAULT '{}',
    print_count INTEGER DEFAULT 0,
    last_printed_at DATETIME,
    
    -- Returns and exchanges
    is_return BOOLEAN DEFAULT FALSE,
    original_order_id INTEGER,
    return_reason TEXT,
    exchange_order_id INTEGER,
    
    -- Commission and performance
    commission_applicable BOOLEAN DEFAULT TRUE,
    commission_amount DECIMAL(8,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Analytics and reporting
    order_source TEXT, -- walk_in, online, phone, app
    marketing_source TEXT,
    campaign_id TEXT,
    device_type TEXT,
    user_agent TEXT,
    
    -- Inventory impact
    inventory_updated BOOLEAN DEFAULT FALSE,
    inventory_update_date DATETIME,
    reserved_inventory BOOLEAN DEFAULT FALSE,
    
    -- Time tracking
    order_started_at DATETIME,
    order_completed_at DATETIME,
    processing_time_seconds INTEGER,
    
    -- Multi-currency support
    currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
    base_currency_total DECIMAL(10,2),
    
    -- Tax details
    tax_details JSON DEFAULT '{}',
    tax_exempt BOOLEAN DEFAULT FALSE,
    tax_exempt_reason TEXT,
    
    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Soft delete
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- Foreign key constraints
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (original_order_id) REFERENCES orders(id),
    FOREIGN KEY (exchange_order_id) REFERENCES orders(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Performance indexes
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_invoice ON orders(invoice_number);
CREATE INDEX idx_orders_receipt ON orders(receipt_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);
CREATE INDEX idx_orders_shift ON orders(shift_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type ON orders(order_type);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_completed_date ON orders(order_completed_at);
CREATE INDEX idx_orders_total ON orders(total_amount);
CREATE INDEX idx_orders_deleted_at ON orders(deleted_at);
CREATE INDEX idx_orders_terminal ON orders(terminal_id);
CREATE INDEX idx_orders_source ON orders(order_source);

-- Composite indexes for common queries
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at);
CREATE INDEX idx_orders_cashier_date ON orders(cashier_id, created_at);
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
CREATE INDEX idx_orders_date_total ON orders(created_at, total_amount);
CREATE INDEX idx_orders_shift_status ON orders(shift_id, status);
CREATE INDEX idx_orders_payment_date ON orders(payment_method, created_at);
CREATE INDEX idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX idx_orders_return_original ON orders(is_return, original_order_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_orders_timestamp 
    AFTER UPDATE ON orders
    FOR EACH ROW
    BEGIN
        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger to auto-generate order number
CREATE TRIGGER generate_order_number
    AFTER INSERT ON orders
    FOR EACH ROW
    WHEN NEW.order_number IS NULL
    BEGIN
        UPDATE orders 
        SET order_number = 'ORD-' || strftime('%Y%m%d', 'now') || '-' || printf('%06d', NEW.id)
        WHERE id = NEW.id;
    END;

-- Trigger to auto-generate invoice number for completed orders
CREATE TRIGGER generate_invoice_number
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN NEW.status = 'completed' AND NEW.invoice_number IS NULL
    BEGIN
        UPDATE orders 
        SET invoice_number = 'INV-' || strftime('%Y%m%d', 'now') || '-' || printf('%06d', NEW.id)
        WHERE id = NEW.id;
    END;

-- Trigger to auto-generate receipt number
CREATE TRIGGER generate_receipt_number
    AFTER INSERT ON orders
    FOR EACH ROW
    WHEN NEW.receipt_number IS NULL
    BEGIN
        UPDATE orders 
        SET receipt_number = 'RCP-' || strftime('%Y%m%d', 'now') || '-' || printf('%06d', NEW.id)
        WHERE id = NEW.id;
    END;

-- Trigger to calculate processing time
CREATE TRIGGER calculate_processing_time
    AFTER UPDATE OF order_completed_at ON orders
    FOR EACH ROW
    WHEN NEW.order_completed_at IS NOT NULL AND NEW.order_started_at IS NOT NULL
    BEGIN
        UPDATE orders 
        SET processing_time_seconds = 
            CAST((julianday(NEW.order_completed_at) - julianday(NEW.order_started_at)) * 86400 AS INTEGER)
        WHERE id = NEW.id;
    END;

-- Trigger to update customer totals
CREATE TRIGGER update_customer_totals_insert
    AFTER INSERT ON orders
    FOR EACH ROW
    WHEN NEW.customer_id IS NOT NULL AND NEW.status = 'completed'
    BEGIN
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount,
            last_order_date = NEW.created_at,
            last_order_amount = NEW.total_amount,
            first_order_date = CASE 
                WHEN first_order_date IS NULL THEN NEW.created_at 
                ELSE first_order_date 
            END
        WHERE id = NEW.customer_id;
    END;

-- Trigger to update staff sales totals
CREATE TRIGGER update_staff_sales_totals
    AFTER INSERT ON orders
    FOR EACH ROW
    WHEN NEW.status = 'completed'
    BEGIN
        UPDATE users 
        SET total_sales = total_sales + NEW.total_amount,
            total_orders = total_orders + 1
        WHERE id = NEW.cashier_id;
    END;