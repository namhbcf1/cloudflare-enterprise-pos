-- ============================================================================
-- MIGRATION 0003: CREATE PRODUCTS TABLE
-- Created: 2024-01-01
-- Description: Products table with comprehensive inventory management
-- ============================================================================

-- Products table with full POS functionality
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Basic product information
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    qr_code TEXT,
    
    -- Categorization
    category_id INTEGER NOT NULL,
    brand TEXT,
    manufacturer TEXT,
    model TEXT,
    
    -- Pricing
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL,
    markup_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    wholesale_price DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    
    -- Tax configuration
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_inclusive BOOLEAN DEFAULT FALSE,
    tax_category TEXT DEFAULT 'standard',
    
    -- Inventory management
    stock_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 1000,
    reorder_level INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    
    -- Physical properties
    weight DECIMAL(8,3),
    weight_unit TEXT DEFAULT 'kg',
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    dimension_unit TEXT DEFAULT 'cm',
    volume DECIMAL(10,3),
    volume_unit TEXT DEFAULT 'l',
    
    -- Product status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_digital BOOLEAN DEFAULT FALSE,
    is_trackable BOOLEAN DEFAULT TRUE,
    is_returnable BOOLEAN DEFAULT TRUE,
    is_age_restricted BOOLEAN DEFAULT FALSE,
    min_age_required INTEGER DEFAULT 0,
    
    -- Supplier information
    supplier_id INTEGER,
    supplier_sku TEXT,
    supplier_cost DECIMAL(10,2),
    lead_time_days INTEGER DEFAULT 0,
    
    -- Media
    image_url TEXT,
    gallery_images JSON DEFAULT '[]',
    video_url TEXT,
    
    -- SEO & Marketing
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    tags JSON DEFAULT '[]',
    
    -- Variants & Options
    has_variants BOOLEAN DEFAULT FALSE,
    variant_type TEXT, -- color, size, style, etc.
    parent_product_id INTEGER,
    variant_options JSON DEFAULT '[]',
    
    -- Sales data
    total_sold INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    last_sold_date DATETIME,
    view_count INTEGER DEFAULT 0,
    last_viewed DATETIME,
    
    -- Commission & Rewards
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(8,2),
    reward_points INTEGER DEFAULT 0,
    loyalty_multiplier DECIMAL(3,2) DEFAULT 1.00,
    
    -- AI & Analytics
    demand_forecast JSON DEFAULT '{}',
    seasonality_data JSON DEFAULT '{}',
    price_elasticity DECIMAL(8,4),
    recommendation_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Dates & Expiry
    launch_date DATE,
    discontinue_date DATE,
    expiry_date DATE,
    batch_number TEXT,
    lot_number TEXT,
    
    -- Compliance & Certifications
    certifications JSON DEFAULT '[]',
    warnings TEXT,
    instructions TEXT,
    ingredients TEXT,
    
    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Soft delete
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- Foreign key constraints
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (parent_product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Performance indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_parent ON products(parent_product_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_price ON products(selling_price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_deleted_at ON products(deleted_at);

-- Composite indexes for common queries
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_active_featured ON products(is_active, is_featured);
CREATE INDEX idx_products_stock_reorder ON products(stock_quantity, reorder_level);
CREATE INDEX idx_products_price_range ON products(selling_price, is_active);
CREATE INDEX idx_products_supplier_active ON products(supplier_id, is_active);
CREATE INDEX idx_products_brand_category ON products(brand, category_id);

-- Full-text search index
CREATE VIRTUAL TABLE products_fts USING fts5(
    name, 
    description, 
    sku, 
    barcode, 
    brand, 
    tags,
    content='products',
    content_rowid='id'
);

-- Triggers for FTS index
CREATE TRIGGER products_fts_insert AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, name, description, sku, barcode, brand, tags)
    VALUES (new.id, new.name, new.description, new.sku, new.barcode, new.brand, new.tags);
END;

CREATE TRIGGER products_fts_delete AFTER DELETE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, sku, barcode, brand, tags)
    VALUES ('delete', old.id, old.name, old.description, old.sku, old.barcode, old.brand, old.tags);
END;

CREATE TRIGGER products_fts_update AFTER UPDATE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, sku, barcode, brand, tags)
    VALUES ('delete', old.id, old.name, old.description, old.sku, old.barcode, old.brand, old.tags);
    INSERT INTO products_fts(rowid, name, description, sku, barcode, brand, tags)
    VALUES (new.id, new.name, new.description, new.sku, new.barcode, new.brand, new.tags);
END;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_products_timestamp 
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
        UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger to calculate markup percentage
CREATE TRIGGER calculate_markup_percentage
    AFTER UPDATE OF cost_price, selling_price ON products
    FOR EACH ROW
    WHEN NEW.cost_price > 0
    BEGIN
        UPDATE products 
        SET markup_percentage = ((NEW.selling_price - NEW.cost_price) / NEW.cost_price) * 100
        WHERE id = NEW.id;
    END;

-- Trigger to update category product count
CREATE TRIGGER update_category_product_count_insert
    AFTER INSERT ON products
    FOR EACH ROW
    WHEN NEW.is_active = TRUE AND NEW.deleted_at IS NULL
    BEGIN
        UPDATE categories 
        SET product_count = product_count + 1 
        WHERE id = NEW.category_id;
    END;

CREATE TRIGGER update_category_product_count_delete
    AFTER UPDATE OF deleted_at ON products
    FOR EACH ROW
    WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
    BEGIN
        UPDATE categories 
        SET product_count = product_count - 1 
        WHERE id = NEW.category_id;
    END;

CREATE TRIGGER update_category_product_count_restore
    AFTER UPDATE OF deleted_at ON products
    FOR EACH ROW
    WHEN NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL
    BEGIN
        UPDATE categories 
        SET product_count = product_count + 1 
        WHERE id = NEW.category_id;
    END;