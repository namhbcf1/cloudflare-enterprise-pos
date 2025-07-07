-- ============================================================================
-- MIGRATION 0002: CREATE CATEGORIES TABLE
-- Created: 2024-01-01
-- Description: Product categories with hierarchical structure
-- ============================================================================

-- Categories table with nested hierarchy support
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Basic information
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_id INTEGER,
    level INTEGER DEFAULT 0,
    path TEXT, -- e.g., "/1/3/7/" for breadcrumb navigation
    children_count INTEGER DEFAULT 0,
    
    -- Display
    image_url TEXT,
    icon TEXT,
    color TEXT DEFAULT '#1890ff',
    sort_order INTEGER DEFAULT 0,
    
    -- SEO & Meta
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    show_in_menu BOOLEAN DEFAULT TRUE,
    
    -- Tax settings
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_inclusive BOOLEAN DEFAULT FALSE,
    
    -- Business rules
    allow_online_orders BOOLEAN DEFAULT TRUE,
    require_age_verification BOOLEAN DEFAULT FALSE,
    min_age_required INTEGER DEFAULT 0,
    
    -- Analytics
    product_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_viewed DATETIME,
    
    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Soft delete
    deleted_at DATETIME,
    deleted_by INTEGER,
    
    -- Foreign key constraints
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_featured ON categories(is_featured);
CREATE INDEX idx_categories_sort ON categories(sort_order);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_path ON categories(path);
CREATE INDEX idx_categories_created_at ON categories(created_at);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);

-- Composite indexes
CREATE INDEX idx_categories_parent_active ON categories(parent_id, is_active);
CREATE INDEX idx_categories_active_sort ON categories(is_active, sort_order);
CREATE INDEX idx_categories_parent_sort ON categories(parent_id, sort_order);
CREATE INDEX idx_categories_level_sort ON categories(level, sort_order);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_categories_timestamp 
    AFTER UPDATE ON categories
    FOR EACH ROW
    BEGIN
        UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger to update path when parent changes
CREATE TRIGGER update_category_path
    AFTER UPDATE OF parent_id ON categories
    FOR EACH ROW
    WHEN NEW.parent_id != OLD.parent_id OR (NEW.parent_id IS NOT NULL AND OLD.parent_id IS NULL) OR (NEW.parent_id IS NULL AND OLD.parent_id IS NOT NULL)
    BEGIN
        UPDATE categories 
        SET path = CASE 
            WHEN NEW.parent_id IS NULL THEN '/' || NEW.id || '/'
            ELSE (SELECT path FROM categories WHERE id = NEW.parent_id) || NEW.id || '/'
        END,
        level = CASE
            WHEN NEW.parent_id IS NULL THEN 0
            ELSE (SELECT level FROM categories WHERE id = NEW.parent_id) + 1
        END
        WHERE id = NEW.id;
    END;

-- Trigger to update children_count when category is added/removed
CREATE TRIGGER update_parent_children_count_insert
    AFTER INSERT ON categories
    FOR EACH ROW
    WHEN NEW.parent_id IS NOT NULL
    BEGIN
        UPDATE categories 
        SET children_count = children_count + 1 
        WHERE id = NEW.parent_id;
    END;

CREATE TRIGGER update_parent_children_count_delete
    AFTER DELETE ON categories
    FOR EACH ROW
    WHEN OLD.parent_id IS NOT NULL
    BEGIN
        UPDATE categories 
        SET children_count = children_count - 1 
        WHERE id = OLD.parent_id;
    END;

CREATE TRIGGER update_parent_children_count_update
    AFTER UPDATE OF parent_id ON categories
    FOR EACH ROW
    WHEN NEW.parent_id != OLD.parent_id OR (NEW.parent_id IS NOT NULL AND OLD.parent_id IS NULL) OR (NEW.parent_id IS NULL AND OLD.parent_id IS NOT NULL)
    BEGIN
        -- Decrease count for old parent
        UPDATE categories 
        SET children_count = children_count - 1 
        WHERE id = OLD.parent_id AND OLD.parent_id IS NOT NULL;
        
        -- Increase count for new parent
        UPDATE categories 
        SET children_count = children_count + 1 
        WHERE id = NEW.parent_id AND NEW.parent_id IS NOT NULL;
    END;