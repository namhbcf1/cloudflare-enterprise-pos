-- ============================================================================
-- MIGRATION 0006: CREATE ORDER ITEMS TABLE
-- Created: 2024-01-01
-- Description: Order items table for detailed product transactions
-- ============================================================================

-- Order items table with detailed product transaction information
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Order relationship
    order_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL, -- Sequential line number within order
    
    -- Product information
    product_id INTEGER NOT NULL,
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL, -- Snapshot at time of sale
    product_description TEXT,
    
    -- Variant information
    variant_id INTEGER,
    variant_name TEXT,
    variant_options JSON DEFAULT '{}',
    
    -- Quantity and pricing
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    original_unit_price DECIMAL(10,2), -- Before any discounts
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Line totals
    subtotal DECIMAL(10,2) NOT NULL, -- quantity * unit_price
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    line_total DECIMAL(10,2) NOT NULL, -- subtotal - discount + tax
    
    -- Discounts and promotions
    item_discount_amount DECIMAL(8,2) DEFAULT 0.00,
    bulk_discount_amount DECIMAL(8,2) DEFAULT 0.00,
    coupon_discount_amount DECIMAL(8,2) DEFAULT 0.00,
    loyalty_discount_amount DECIMAL(8,2) DEFAULT 0.00,
    staff_discount_amount DECIMAL(8,2) DEFAULT 0.00,
    
    -- Commission and rewards
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(8,2) DEFAULT 0.00,
    points_earned INTEGER DEFAULT 0,
    points_value DECIMAL(6,2) DEFAULT 0.00,
    
    -- Product attributes at time of sale
    weight DECIMAL(8,3),
    weight_unit TEXT,
    category_name TEXT,
    brand_name TEXT,
    supplier_name TEXT,
    
    -- Inventory tracking
    lot_number TEXT,
    batch_number TEXT,
    serial_number TEXT,
    expiry_date DATE,
    
    -- Return and exchange information
    is_returned BOOLEAN DEFAULT FALSE,
    returned_quantity INTEGER DEFAULT 0,
    return_reason TEXT,
    return_date DATETIME,
    is_exchanged BOOLEAN DEFAULT FALSE,
    exchange_item_id INTEGER,
    
    -- Fulfillment details
    fulfillment_status TEXT DEFAULT 'fulfilled' CHECK(fulfillment_status IN ('pending', 'fulfilled', 'shipped', 'delivered', 'pickup_ready', 'picked_up', 'cancelled', 'returned')),
    ship_separately BOOLEAN DEFAULT FALSE,
    requires_shipping BOOLEAN DEFAULT FALSE,
    
    -- Gift and personalization
    is_gift BOOLEAN DEFAULT FALSE,
    gift_wrap BOOLEAN DEFAULT FALSE,
    gift_message TEXT,
    personalization TEXT,
    engraving_text TEXT,
    
    -- Special handling
    requires_id_check BOOLEAN DEFAULT FALSE,
    age_verification_done BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    handling_notes TEXT,
    
    -- Analytics and tracking
    product_margin DECIMAL(8,2), -- unit_price - cost_price
    margin_percentage DECIMAL(5,2),
    profit_amount DECIMAL(8,2), -- (unit_price - cost_price) * quantity
    
    -- Bundling and kits
    is_bundle_item BOOLEAN DEFAULT FALSE,
    bundle_parent_id INTEGER,
    bundle_discount_applied DECIMAL(8,2) DEFAULT 0.00,
    
    -- Subscription and recurring
    is_subscription BOOLEAN DEFAULT FALSE,
    subscription_frequency TEXT,
    subscription_next_date DATE,
    
    -- Custom pricing
    manual_price_adjustment BOOLEAN DEFAULT FALSE,
    price_adjustment_reason TEXT,
    price_approved_by INTEGER,
    
    -- Multi-currency support
    currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
    base_currency_unit_price DECIMAL(10,2),
    base_currency_line_total DECIMAL(10,2),
    
    -- Tax details
    tax_category TEXT,
    tax_details JSON DEFAULT '{}',
    tax_exempt BOOLEAN DEFAULT FALSE,
    tax_exempt_reason TEXT,
    
    -- Notes and metadata
    notes TEXT,
    internal_notes TEXT,
    custom_fields JSON DEFAULT '{}',
    
    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Soft delete
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    FOREIGN KEY (exchange_item_id) REFERENCES order_items(id),
    FOREIGN KEY (bundle_parent_id) REFERENCES order_items(id),
    FOREIGN KEY (price_approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id),
    
    -- Constraints
    UNIQUE(order_id, line_number),
    CHECK(quantity > 0),
    CHECK(unit_price >= 0),
    CHECK(subtotal >= 0),
    CHECK(line_total >= 0),
    CHECK(returned_quantity >= 0),
    CHECK(returned_quantity <= quantity)
);

-- Performance indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
CREATE INDEX idx_order_items_sku ON order_items(product_sku);
CREATE INDEX idx_order_items_line_number ON order_items(order_id, line_number);
CREATE INDEX idx_order_items_created_at ON order_items(created_at);
CREATE INDEX idx_order_items_deleted_at ON order_items(deleted_at);
CREATE INDEX idx_order_items_returned ON order_items(is_returned);
CREATE INDEX idx_order_items_exchanged ON order_items(is_exchanged);
CREATE INDEX idx_order_items_bundle ON order_items(is_bundle_item);
CREATE INDEX idx_order_items_bundle_parent ON order_items(bundle_parent_id);

-- Composite indexes for common queries
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);
CREATE INDEX idx_order_items_product_date ON order_items(product_id, created_at);
CREATE INDEX idx_order_items_fulfillment ON order_items(fulfillment_status);
CREATE INDEX idx_order_items_gift ON order_items(is_gift);
CREATE INDEX idx_order_items_subscription ON order_items(is_subscription);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_order_items_timestamp 
    AFTER UPDATE ON order_items
    FOR EACH ROW
    BEGIN
        UPDATE order_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger to auto-calculate line totals
CREATE TRIGGER calculate_order_item_totals
    AFTER INSERT ON order_items
    FOR EACH ROW
    BEGIN
        UPDATE order_items 
        SET subtotal = NEW.quantity * NEW.unit_price,
            line_total = (NEW.quantity * NEW.unit_price) - NEW.discount_amount + NEW.tax_amount,
            profit_amount = (NEW.unit_price - COALESCE(NEW.cost_price, 0)) * NEW.quantity,
            product_margin = NEW.unit_price - COALESCE(NEW.cost_price, 0),
            margin_percentage = CASE 
                WHEN NEW.cost_price > 0 THEN ((NEW.unit_price - NEW.cost_price) / NEW.cost_price) * 100
                ELSE 0 
            END
        WHERE id = NEW.id;
    END;

-- Trigger to recalculate totals on quantity/price changes
CREATE TRIGGER recalculate_order_item_totals
    AFTER UPDATE OF quantity, unit_price, discount_amount, tax_amount ON order_items
    FOR EACH ROW
    BEGIN
        UPDATE order_items 
        SET subtotal = NEW.quantity * NEW.unit_price,
            line_total = (NEW.quantity * NEW.unit_price) - NEW.discount_amount + NEW.tax_amount,
            profit_amount = (NEW.unit_price - COALESCE(NEW.cost_price, 0)) * NEW.quantity,
            product_margin = NEW.unit_price - COALESCE(NEW.cost_price, 0),
            margin_percentage = CASE 
                WHEN NEW.cost_price > 0 THEN ((NEW.unit_price - NEW.cost_price) / NEW.cost_price) * 100
                ELSE 0 
            END
        WHERE id = NEW.id;
    END;

-- Trigger to update product sales data
CREATE TRIGGER update_product_sales_data
    AFTER INSERT ON order_items
    FOR EACH ROW
    BEGIN
        UPDATE products 
        SET total_sold = total_sold + NEW.quantity,
            total_revenue = total_revenue + NEW.line_total,
            last_sold_date = NEW.created_at
        WHERE id = NEW.product_id;
    END;

-- Trigger to handle returns and update product sales
CREATE TRIGGER handle_product_return
    AFTER UPDATE OF is_returned, returned_quantity ON order_items
    FOR EACH ROW
    WHEN NEW.is_returned = TRUE AND OLD.is_returned = FALSE
    BEGIN
        UPDATE products 
        SET total_sold = total_sold - NEW.returned_quantity,
            total_revenue = total_revenue - (NEW.unit_price * NEW.returned_quantity)
        WHERE id = NEW.product_id;
    END;

-- Trigger to auto-assign line numbers
CREATE TRIGGER assign_line_number
    AFTER INSERT ON order_items
    FOR EACH ROW
    WHEN NEW.line_number IS NULL
    BEGIN
        UPDATE order_items 
        SET line_number = (
            SELECT COALESCE(MAX(line_number), 0) + 1 
            FROM order_items 
            WHERE order_id = NEW.order_id AND id != NEW.id
        )
        WHERE id = NEW.id;
    END;

-- Trigger to validate bundle relationships
CREATE TRIGGER validate_bundle_relationship
    BEFORE INSERT ON order_items
    FOR EACH ROW
    WHEN NEW.bundle_parent_id IS NOT NULL
    BEGIN
        SELECT CASE
            WHEN (SELECT COUNT(*) FROM order_items WHERE id = NEW.bundle_parent_id AND order_id = NEW.order_id) = 0
            THEN RAISE(ABORT, 'Bundle parent must exist in the same order')
        END;
    END;