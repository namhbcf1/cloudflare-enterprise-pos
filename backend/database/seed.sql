-- =====================================================
-- ENTERPRISE POS SYSTEM - SEED DATA
-- Sample data for development and demo purposes
-- =====================================================

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM activity_logs;
-- DELETE FROM inventory_logs;
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM achievements;
-- DELETE FROM staff_stats;
-- DELETE FROM customers;
-- DELETE FROM products;
-- DELETE FROM categories;
-- DELETE FROM badges;
-- DELETE FROM challenges;
-- DELETE FROM payment_methods;
-- DELETE FROM settings;
-- DELETE FROM users;

-- =====================================================
-- 1. USERS (Admin, Staff, Cashiers)
-- =====================================================

INSERT INTO users (id, email, password_hash, name, role, phone, avatar_url, is_active, created_at, updated_at) VALUES
-- Admin user (password: admin123)
('admin-001', 'admin@pos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyA0yBXjAMd4aK', 'Admin User', 'admin', '+1234567890', '/avatars/admin.jpg', 1, datetime('now', '-30 days'), datetime('now')),

-- Staff members (password: staff123)
('staff-001', 'john.staff@pos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyA0yBXjAMd4aK', 'John Smith', 'staff', '+1234567891', '/avatars/john.jpg', 1, datetime('now', '-25 days'), datetime('now')),
('staff-002', 'jane.staff@pos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyA0yBXjAMd4aK', 'Jane Wilson', 'staff', '+1234567892', '/avatars/jane.jpg', 1, datetime('now', '-20 days'), datetime('now')),

-- Cashiers (password: cashier123)
('cashier-001', 'mike.cashier@pos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyA0yBXjAMd4aK', 'Mike Johnson', 'cashier', '+1234567893', '/avatars/mike.jpg', 1, datetime('now', '-15 days'), datetime('now')),
('cashier-002', 'sarah.cashier@pos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyA0yBXjAMd4aK', 'Sarah Davis', 'cashier', '+1234567894', '/avatars/sarah.jpg', 1, datetime('now', '-10 days'), datetime('now')),
('cashier-003', 'tom.cashier@pos.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTyA0yBXjAMd4aK', 'Tom Brown', 'cashier', '+1234567895', '/avatars/tom.jpg', 1, datetime('now', '-5 days'), datetime('now'));

-- =====================================================
-- 2. CATEGORIES
-- =====================================================

INSERT INTO categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
('cat-001', 'Electronics', 'Smartphones, tablets, accessories', 'mobile', '#1890ff', 1, 1, datetime('now', '-30 days'), datetime('now')),
('cat-002', 'Clothing', 'T-shirts, jeans, shoes, accessories', 'appstore', '#52c41a', 2, 1, datetime('now', '-30 days'), datetime('now')),
('cat-003', 'Food & Beverages', 'Snacks, drinks, fresh food', 'coffee', '#fa8c16', 3, 1, datetime('now', '-30 days'), datetime('now')),
('cat-004', 'Books & Stationery', 'Books, notebooks, pens', 'book', '#722ed1', 4, 1, datetime('now', '-30 days'), datetime('now')),
('cat-005', 'Home & Garden', 'Furniture, decorations, tools', 'home', '#eb2f96', 5, 1, datetime('now', '-30 days'), datetime('now')),
('cat-006', 'Health & Beauty', 'Cosmetics, personal care', 'heart', '#f5222d', 6, 1, datetime('now', '-30 days'), datetime('now'));

-- =====================================================
-- 3. PRODUCTS
-- =====================================================

INSERT INTO products (id, sku, name, description, category_id, price, cost_price, stock_quantity, reorder_level, barcode, image_url, weight, tax_rate, is_active, created_at, updated_at) VALUES
-- Electronics
('prod-001', 'IPH15-128', 'iPhone 15 128GB', 'Latest iPhone with advanced features', 'cat-001', 999.99, 750.00, 25, 5, '1234567890123', '/products/iphone15.jpg', 0.174, 10.00, 1, datetime('now', '-25 days'), datetime('now')),
('prod-002', 'GAL-S24-256', 'Samsung Galaxy S24 256GB', 'Premium Android smartphone', 'cat-001', 899.99, 650.00, 30, 5, '1234567890124', '/products/galaxy-s24.jpg', 0.168, 10.00, 1, datetime('now', '-25 days'), datetime('now')),
('prod-003', 'IPD-AIR-5', 'iPad Air 5th Gen', 'Powerful tablet for work and play', 'cat-001', 599.99, 450.00, 15, 3, '1234567890125', '/products/ipad-air.jpg', 0.461, 10.00, 1, datetime('now', '-25 days'), datetime('now')),
('prod-004', 'APWT-SE2', 'Apple Watch SE 2nd Gen', 'Fitness and health tracking', 'cat-001', 299.99, 220.00, 40, 10, '1234567890126', '/products/apple-watch-se.jpg', 0.033, 10.00, 1, datetime('now', '-25 days'), datetime('now')),

-- Clothing
('prod-005', 'TSH-BLU-L', 'Blue Cotton T-Shirt (L)', 'Comfortable cotton t-shirt', 'cat-002', 24.99, 12.00, 100, 20, '1234567890127', '/products/blue-tshirt.jpg', 0.200, 8.25, 1, datetime('now', '-20 days'), datetime('now')),
('prod-006', 'JEA-SKN-32', 'Skinny Jeans 32"', 'Modern fit denim jeans', 'cat-002', 79.99, 40.00, 60, 15, '1234567890128', '/products/skinny-jeans.jpg', 0.600, 8.25, 1, datetime('now', '-20 days'), datetime('now')),
('prod-007', 'SNK-RUN-9', 'Running Sneakers Size 9', 'Lightweight running shoes', 'cat-002', 129.99, 70.00, 45, 10, '1234567890129', '/products/running-sneakers.jpg', 0.800, 8.25, 1, datetime('now', '-20 days'), datetime('now')),

-- Food & Beverages
('prod-008', 'COK-CAN-355', 'Coca Cola 355ml', 'Classic soft drink', 'cat-003', 1.99, 0.80, 200, 50, '1234567890130', '/products/coca-cola.jpg', 0.355, 5.00, 1, datetime('now', '-15 days'), datetime('now')),
('prod-009', 'CHI-BBQ-200', 'BBQ Chips 200g', 'Crispy barbecue flavored chips', 'cat-003', 3.49, 1.50, 150, 30, '1234567890131', '/products/bbq-chips.jpg', 0.200, 5.00, 1, datetime('now', '-15 days'), datetime('now')),
('prod-010', 'SAN-HAM-250', 'Ham Sandwich 250g', 'Fresh ham and cheese sandwich', 'cat-003', 8.99, 4.50, 25, 10, '1234567890132', '/products/ham-sandwich.jpg', 0.250, 5.00, 1, datetime('now', '-15 days'), datetime('now')),

-- Books & Stationery
('prod-011', 'NOT-A4-100', 'A4 Notebook 100 pages', 'Lined notebook for notes', 'cat-004', 12.99, 6.00, 80, 20, '1234567890133', '/products/a4-notebook.jpg', 0.300, 0.00, 1, datetime('now', '-10 days'), datetime('now')),
('prod-012', 'PEN-BLU-10', 'Blue Ballpoint Pen (10 pack)', 'Smooth writing ballpoint pens', 'cat-004', 9.99, 4.50, 120, 25, '1234567890134', '/products/blue-pens.jpg', 0.100, 0.00, 1, datetime('now', '-10 days'), datetime('now')),
('prod-013', 'BOK-FIC-001', 'Mystery Novel "The Secret"', 'Bestselling mystery novel', 'cat-004', 19.99, 10.00, 35, 8, '1234567890135', '/products/mystery-novel.jpg', 0.400, 0.00, 1, datetime('now', '-10 days'), datetime('now')),

-- Home & Garden
('prod-014', 'CAN-LED-15W', 'LED Candle 15W', 'Energy efficient LED candle', 'cat-005', 34.99, 18.00, 50, 12, '1234567890136', '/products/led-candle.jpg', 0.250, 8.25, 1, datetime('now', '-8 days'), datetime('now')),
('prod-015', 'PLT-SUC-SM', 'Small Succulent Plant', 'Low maintenance succulent', 'cat-005', 14.99, 7.50, 75, 15, '1234567890137', '/products/succulent.jpg', 0.500, 0.00, 1, datetime('now', '-8 days'), datetime('now')),
('prod-016', 'CUS-VEL-BLU', 'Blue Velvet Cushion', 'Decorative throw cushion', 'cat-005', 29.99, 15.00, 40, 8, '1234567890138', '/products/blue-cushion.jpg', 0.800, 8.25, 1, datetime('now', '-8 days'), datetime('now')),

-- Health & Beauty
('prod-017', 'SHP-ORG-500', 'Organic Shampoo 500ml', 'Natural organic hair care', 'cat-006', 18.99, 9.50, 65, 15, '1234567890139', '/products/organic-shampoo.jpg', 0.500, 8.25, 1, datetime('now', '-5 days'), datetime('now')),
('prod-018', 'LIP-PIN-RED', 'Red Lipstick', 'Long-lasting matte lipstick', 'cat-006', 24.99, 12.00, 85, 20, '1234567890140', '/products/red-lipstick.jpg', 0.050, 8.25, 1, datetime('now', '-5 days'), datetime('now')),
('prod-019', 'FAC-CRM-50', 'Face Cream 50ml', 'Anti-aging moisturizing cream', 'cat-006', 39.99, 20.00, 55, 12, '1234567890141', '/products/face-cream.jpg', 0.080, 8.25, 1, datetime('now', '-5 days'), datetime('now')),
('prod-020', 'PER-SPR-100', 'Perfume Spray 100ml', 'Elegant floral fragrance', 'cat-006', 89.99, 45.00, 30, 8, '1234567890142', '/products/perfume.jpg', 0.150, 8.25, 1, datetime('now', '-5 days'), datetime('now'));

-- =====================================================
-- 4. CUSTOMERS (CRM Data)
-- =====================================================

INSERT INTO customers (id, name, email, phone, address, city, postal_code, date_of_birth, loyalty_points, total_spent, visit_count, last_visit, is_active, created_at, updated_at) VALUES
('cust-001', 'Alice Johnson', 'alice.johnson@email.com', '+1555123001', '123 Main St', 'New York', '10001', '1985-03-15', 150, 2450.75, 12, datetime('now', '-2 days'), 1, datetime('now', '-60 days'), datetime('now', '-2 days')),
('cust-002', 'Bob Williams', 'bob.williams@email.com', '+1555123002', '456 Oak Ave', 'Los Angeles', '90001', '1990-07-22', 85, 1320.50, 8, datetime('now', '-5 days'), 1, datetime('now', '-45 days'), datetime('now', '-5 days')),
('cust-003', 'Carol Brown', 'carol.brown@email.com', '+1555123003', '789 Pine St', 'Chicago', '60001', '1988-11-08', 220, 3750.25, 15, datetime('now', '-1 day'), 1, datetime('now', '-90 days'), datetime('now', '-1 day')),
('cust-004', 'David Miller', 'david.miller@email.com', '+1555123004', '321 Elm St', 'Houston', '77001', '1975-05-30', 45, 865.00, 5, datetime('now', '-10 days'), 1, datetime('now', '-30 days'), datetime('now', '-10 days')),
('cust-005', 'Emma Davis', 'emma.davis@email.com', '+1555123005', '654 Maple Dr', 'Phoenix', '85001', '1992-09-12', 95, 1580.75, 9, datetime('now', '-3 days'), 1, datetime('now', '-75 days'), datetime('now', '-3 days')),
('cust-006', 'Frank Wilson', 'frank.wilson@email.com', '+1555123006', '987 Cedar Ln', 'Philadelphia', '19001', '1980-12-25', 180, 2890.50, 11, datetime('now', '-7 days'), 1, datetime('now', '-120 days'), datetime('now', '-7 days')),
('cust-007', 'Grace Taylor', 'grace.taylor@email.com', '+1555123007', '147 Birch St', 'San Antonio', '78001', '1995-01-18', 65, 1125.25, 6, datetime('now', '-14 days'), 1, datetime('now', '-50 days'), datetime('now', '-14 days')),
('cust-008', 'Henry Anderson', 'henry.anderson@email.com', '+1555123008', '258 Spruce Ave', 'San Diego', '92001', '1987-04-03', 125, 2150.00, 10, datetime('now', '-4 days'), 1, datetime('now', '-80 days'), datetime('now', '-4 days')),
('cust-009', 'Ivy Martinez', 'ivy.martinez@email.com', '+1555123009', '369 Willow Rd', 'Dallas', '75001', '1993-08-27', 35, 685.50, 4, datetime('now', '-20 days'), 1, datetime('now', '-25 days'), datetime('now', '-20 days')),
('cust-010', 'Jack Thompson', 'jack.thompson@email.com', '+1555123010', '741 Ash St', 'San Jose', '95001', '1982-06-14', 200, 3250.75, 14, datetime('now', '-6 days'), 1, datetime('now', '-100 days'), datetime('now', '-6 days'));

-- =====================================================
-- 5. PAYMENT METHODS
-- =====================================================

INSERT INTO payment_methods (id, name, type, is_active, processing_fee, icon, settings, created_at) VALUES
('pay-001', 'Cash', 'cash', 1, 0.00, 'dollar', '{}', datetime('now', '-30 days')),
('pay-002', 'Credit Card', 'card', 1, 2.5, 'credit-card', '{"accepted_cards": ["visa", "mastercard", "amex"]}', datetime('now', '-30 days')),
('pay-003', 'Debit Card', 'card', 1, 1.5, 'credit-card', '{"accepted_cards": ["visa", "mastercard"]}', datetime('now', '-30 days')),
('pay-004', 'Apple Pay', 'digital_wallet', 1, 2.0, 'apple', '{"supported_devices": ["iphone", "ipad", "apple_watch"]}', datetime('now', '-30 days')),
('pay-005', 'Google Pay', 'digital_wallet', 1, 2.0, 'google', '{"supported_devices": ["android"]}', datetime('now', '-30 days')),
('pay-006', 'Loyalty Points', 'loyalty_points', 1, 0.00, 'star', '{"points_per_dollar": 100}', datetime('now', '-30 days'));

-- =====================================================
-- 6. STAFF STATISTICS (Gamification)
-- =====================================================

INSERT INTO staff_stats (id, user_id, total_sales, total_orders, total_points, current_streak, best_streak, level, experience_points, commission_earned, last_sale, created_at, updated_at) VALUES
('stat-001', 'staff-001', 15850.75, 89, 1585, 7, 12, 5, 2450, 317.02, datetime('now', '-1 day'), datetime('now', '-25 days'), datetime('now', '-1 day')),
('stat-002', 'staff-002', 12430.50, 67, 1243, 4, 8, 4, 1890, 248.61, datetime('now', '-2 days'), datetime('now', '-20 days'), datetime('now', '-2 days')),
('stat-003', 'cashier-001', 8965.25, 145, 896, 12, 15, 3, 1420, 179.31, datetime('now', '-0.5 days'), datetime('now', '-15 days'), datetime('now', '-0.5 days')),
('stat-004', 'cashier-002', 7820.00, 128, 782, 8, 10, 3, 1280, 156.40, datetime('now', '-1.5 days'), datetime('now', '-10 days'), datetime('now', '-1.5 days')),
('stat-005', 'cashier-003', 5640.75, 98, 564, 3, 6, 2, 945, 112.82, datetime('now', '-3 days'), datetime('now', '-5 days'), datetime('now', '-3 days'));

-- =====================================================
-- 7. BADGES (Achievement System)
-- =====================================================

INSERT INTO badges (id, name, description, icon, color, criteria, points, rarity, is_active, created_at) VALUES
('badge-001', 'First Sale', 'Complete your first successful sale', 'trophy', '#faad14', '{"type": "sales_count", "value": 1}', 50, 'common', 1, datetime('now', '-30 days')),
('badge-002', 'Sales Rookie', 'Complete 10 sales', 'star', '#52c41a', '{"type": "sales_count", "value": 10}', 100, 'common', 1, datetime('now', '-30 days')),
('badge-003', 'Sales Pro', 'Complete 50 sales', 'fire', '#1890ff', '{"type": "sales_count", "value": 50}', 250, 'rare', 1, datetime('now', '-30 days')),
('badge-004', 'Sales Legend', 'Complete 100 sales', 'crown', '#722ed1', '{"type": "sales_count", "value": 100}', 500, 'epic', 1, datetime('now', '-30 days')),
('badge-005', 'Big Spender', 'Single sale over $500', 'dollar', '#fa541c', '{"type": "single_sale", "value": 500}', 200, 'rare', 1, datetime('now', '-30 days')),
('badge-006', 'Streak Master', 'Maintain 10-day sales streak', 'lightning-bolt', '#eb2f96', '{"type": "sales_streak", "value": 10}', 300, 'epic', 1, datetime('now', '-30 days')),
('badge-007', 'Customer Favorite', 'Serve 25 different customers', 'heart', '#f5222d', '{"type": "unique_customers", "value": 25}', 150, 'rare', 1, datetime('now', '-30 days')),
('badge-008', 'Speed Demon', 'Complete 20 sales in one day', 'rocket', '#13c2c2', '{"type": "daily_sales", "value": 20}', 400, 'epic', 1, datetime('now', '-30 days')),
('badge-009', 'Early Bird', 'First sale of the day 5 times', 'sun', '#fadb14', '{"type": "first_sale_day", "value": 5}', 100, 'common', 1, datetime('now', '-30 days')),
('badge-010', 'Upsell Master', 'Achieve $10k in total sales', 'gift', '#9254de', '{"type": "total_sales", "value": 10000}', 750, 'legendary', 1, datetime('now', '-30 days'));

-- =====================================================
-- 8. ACHIEVEMENTS (User Progress)
-- =====================================================

INSERT INTO achievements (id, user_id, badge_id, progress, is_completed, completed_at, created_at) VALUES
-- Staff-001 achievements
('ach-001', 'staff-001', 'badge-001', 1, 1, datetime('now', '-24 days'), datetime('now', '-25 days')),
('ach-002', 'staff-001', 'badge-002', 10, 1, datetime('now', '-20 days'), datetime('now', '-25 days')),
('ach-003', 'staff-001', 'badge-003', 50, 1, datetime('now', '-10 days'), datetime('now', '-25 days')),
('ach-004', 'staff-001', 'badge-004', 89, 0, NULL, datetime('now', '-25 days')),
('ach-005', 'staff-001', 'badge-005', 1, 1, datetime('now', '-15 days'), datetime('now', '-25 days')),
('ach-006', 'staff-001', 'badge-010', 15850, 1, datetime('now', '-5 days'), datetime('now', '-25 days')),

-- Cashier-001 achievements
('ach-007', 'cashier-001', 'badge-001', 1, 1, datetime('now', '-14 days'), datetime('now', '-15 days')),
('ach-008', 'cashier-001', 'badge-002', 10, 1, datetime('now', '-12 days'), datetime('now', '-15 days')),
('ach-009', 'cashier-001', 'badge-003', 50, 1, datetime('now', '-8 days'), datetime('now', '-15 days')),
('ach-010', 'cashier-001', 'badge-004', 145, 1, datetime('now', '-3 days'), datetime('now', '-15 days')),
('ach-011', 'cashier-001', 'badge-006', 12, 1, datetime('now', '-2 days'), datetime('now', '-15 days'));

-- =====================================================
-- 9. CHALLENGES (Gamification Tasks)
-- =====================================================

INSERT INTO challenges (id, title, description, type, target_value, reward_points, reward_badge_id, start_date, end_date, is_active, created_at) VALUES
('chal-001', 'Daily Sales Goal', 'Complete 5 sales today', 'daily', 5, 50, NULL, DATE('now'), DATE('now'), 1, datetime('now')),
('chal-002', 'Weekly Revenue Target', 'Achieve $2000 in sales this week', 'weekly', 2000, 200, NULL, DATE('now', 'weekday 1', '-7 days'), DATE('now', 'weekday 0'), 1, datetime('now', '-7 days')),
('chal-003', 'Monthly Customer Champion', 'Serve 100 different customers this month', 'monthly', 100, 500, 'badge-007', DATE('now', 'start of month'), DATE('now', 'start of month', '+1 month', '-1 day'), 1, datetime('now', '-30 days')),
('chal-004', 'Upselling Master', 'Achieve average order value of $75', 'weekly', 75, 150, NULL, DATE('now', 'weekday 1', '-7 days'), DATE('now', 'weekday 0'), 1, datetime('now', '-7 days')),
('chal-005', 'Perfect Week', 'No cancelled or returned orders this week', 'weekly', 0, 100, NULL, DATE('now', 'weekday 1', '-7 days'), DATE('now', 'weekday 0'), 1, datetime('now', '-7 days'));

-- =====================================================
-- 10. SAMPLE ORDERS (Transaction History)
-- =====================================================

INSERT INTO orders (id, order_number, customer_id, cashier_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, notes, receipt_printed, created_at, updated_at) VALUES
-- Recent orders for analytics
('ord-001', 'ORD-20241201-001', 'cust-001', 'cashier-001', 1199.98, 119.99, 0.00, 1319.97, 'card', 'completed', 'completed', 'Customer requested gift wrapping', 1, datetime('now', '-2 days'), datetime('now', '-2 days')),
('ord-002', 'ORD-20241201-002', 'cust-003', 'staff-001', 45.97, 2.30, 5.00, 43.27, 'cash', 'completed', 'completed', NULL, 1, datetime('now', '-1 day'), datetime('now', '-1 day')),
('ord-003', 'ORD-20241201-003', NULL, 'cashier-002', 129.99, 10.72, 0.00, 140.71, 'digital_wallet', 'completed', 'completed', 'Walk-in customer', 1, datetime('now', '-1 day'), datetime('now', '-1 day')),
('ord-004', 'ORD-20241201-004', 'cust-005', 'cashier-001', 78.96, 6.51, 10.00, 75.47, 'card', 'completed', 'completed', 'Loyalty discount applied', 1, datetime('now', '-0.5 days'), datetime('now', '-0.5 days')),
('ord-005', 'ORD-20241201-005', 'cust-002', 'staff-002', 599.99, 59.99, 0.00, 659.98, 'card', 'completed', 'completed', 'Corporate purchase', 1, datetime('now', '-0.2 days'), datetime('now', '-0.2 days'));

-- =====================================================
-- 11. ORDER ITEMS (Transaction Details)
-- =====================================================

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, discount_amount, created_at) VALUES
-- Order 1 items (iPhone + Watch)
('item-001', 'ord-001', 'prod-001', 1, 999.99, 999.99, 0.00, datetime('now', '-2 days')),
('item-002', 'ord-001', 'prod-004', 1, 199.99, 199.99, 0.00, datetime('now', '-2 days')),

-- Order 2 items (Mixed items)
('item-003', 'ord-002', 'prod-005', 2, 24.99, 49.98, 5.00, datetime('now', '-1 day')),
('item-004', 'ord-002', 'prod-008', 3, 1.99, 5.97, 0.00, datetime('now', '-1 day')),

-- Order 3 items (Sneakers)
('item-005', 'ord-003', 'prod-007', 1, 129.99, 129.99, 0.00, datetime('now', '-1 day')),

-- Order 4 items (Multiple small items)
('item-006', 'ord-004', 'prod-009', 2, 3.49, 6.98, 0.00, datetime('now', '-0.5 days')),
('item-007', 'ord-004', 'prod-011', 1, 12.99, 12.99, 0.00, datetime('now', '-0.5 days')),
('item-008', 'ord-004', 'prod-012', 3, 9.99, 29.97, 0.00, datetime('now', '-0.5 days')),
('item-009', 'ord-004', 'prod-014', 1, 34.99, 34.99, 10.00, datetime('now', '-0.5 days')),

-- Order 5 items (iPad)
('item-010', 'ord-005', 'prod-003', 1, 599.99, 599.99, 0.00, datetime('now', '-0.2 days'));

-- =====================================================
-- 12. INVENTORY LOGS (Stock Movement History)
-- =====================================================

INSERT INTO inventory_logs (id, product_id, user_id, type, quantity_change, previous_quantity, new_quantity, reason, reference_id, created_at) VALUES
-- Initial stock entries
('log-001', 'prod-001', 'admin-001', 'restock', 30, 0, 30, 'Initial inventory', NULL, datetime('now', '-25 days')),
('log-002', 'prod-002', 'admin-001', 'restock', 35, 0, 35, 'Initial inventory', NULL, datetime('now', '-25 days')),
('log-003', 'prod-003', 'admin-001', 'restock', 20, 0, 20, 'Initial inventory', NULL, datetime('now', '-25 days')),

-- Sales transactions
('log-004', 'prod-001', 'cashier-001', 'sale', -1, 30, 29, 'Product sale', 'ord-001', datetime('now', '-2 days')),
('log-005', 'prod-004', 'cashier-001', 'sale', -1, 45, 44, 'Product sale', 'ord-001', datetime('now', '-2 days')),
('log-006', 'prod-005', 'staff-001', 'sale', -2, 102, 100, 'Product sale', 'ord-002', datetime('now', '-1 day')),
('log-007', 'prod-007', 'cashier-002', 'sale', -1, 46, 45, 'Product sale', 'ord-003', datetime('now', '-1 day')),
('log-008', 'prod-003', 'staff-002', 'sale', -1, 16, 15, 'Product sale', 'ord-005', datetime('now', '-0.2 days')),

-- Stock adjustments
('log-009', 'prod-008', 'staff-001', 'adjustment', -5, 205, 200, 'Damaged items removed', NULL, datetime('now', '-3 days')),
('log-010', 'prod-012', 'staff-002', 'restock', 20, 100, 120, 'Weekly restocking', NULL, datetime('now', '-1 day'));

-- =====================================================
-- 13. SYSTEM SETTINGS
-- =====================================================

INSERT INTO settings (id, key, value, type, description, is_public, created_at, updated_at) VALUES
('set-001', 'store_name', 'Enterprise POS Demo Store', 'string', 'Store display name', 1, datetime('now', '-30 days'), datetime('now')),
('set-002', 'store_address', '123 Business St, Commerce City, CC 12345', 'string', 'Store physical address', 1, datetime('now', '-30 days'), datetime('now')),
('set-003', 'store_phone', '+1-555-STORE-01', 'string', 'Store contact phone', 1, datetime('now', '-30 days'), datetime('now')),
('set-004', 'store_email', 'info@enterprisepos.com', 'string', 'Store contact email', 1, datetime('now', '-30 days'), datetime('now')),
('set-005', 'tax_rate', '8.25', 'number', 'Default tax rate percentage', 0, datetime('now', '-30 days'), datetime('now')),
('set-006', 'currency', 'USD', 'string', 'Store currency code', 1, datetime('now', '-30 days'), datetime('now')),
('set-007', 'loyalty_points_ratio', '100', 'number', 'Points earned per dollar spent', 0, datetime('now', '-30 days'), datetime('now')),
('set-008', 'low_stock_threshold', '10', 'number', 'Default low stock alert threshold', 0, datetime('now', '-30 days'), datetime('now')),
('set-009', 'receipt_footer', 'Thank you for shopping with us!', 'string', 'Receipt footer message', 1, datetime('now', '-30 days'), datetime('now')),
('set-010', 'business_hours', '{"monday": "9:00-21:00", "tuesday": "9:00-21:00", "wednesday": "9:00-21:00", "thursday": "9:00-21:00", "friday": "9:00-22:00", "saturday": "9:00-22:00", "sunday": "10:00-20:00"}', 'json', 'Store operating hours', 1, datetime('now', '-30 days'), datetime('now'));

-- =====================================================
-- 14. NOTIFICATIONS (Sample alerts)
-- =====================================================

INSERT INTO notifications (id, user_id, title, message, type, is_read, action_url, metadata, created_at) VALUES
('not-001', 'admin-001', 'Low Stock Alert', 'iPhone 15 128GB is running low (5 units remaining)', 'warning', 0, '/products/prod-001', '{"product_id": "prod-001", "current_stock": 5}', datetime('now', '-1 hour')),
('not-002', 'staff-001', 'Sales Goal Achieved', 'Congratulations! You have reached your daily sales goal', 'success', 1, '/dashboard', '{"goal_amount": 1000, "achieved_amount": 1200}', datetime('now', '-2 hours')),
('not-003', 'cashier-001', 'New Badge Earned', 'You earned the "Sales Pro" badge for completing 50 sales!', 'success', 0, '/gamification', '{"badge_id": "badge-003"}', datetime('now', '-3 hours')),
('not-004', 'admin-001', 'Daily Report Ready', 'Your daily sales report is ready for review', 'info', 1, '/reports/daily', '{"report_date": "2024-12-01"}', datetime('now', '-4 hours')),
('not-005', 'staff-002', 'Customer Feedback', 'New 5-star review received from Alice Johnson', 'success', 0, '/customers/cust-001', '{"customer_id": "cust-001", "rating": 5}', datetime('now', '-6 hours'));

-- =====================================================
-- 15. AI RECOMMENDATIONS (Sample data)
-- =====================================================

INSERT INTO ai_recommendations (id, type, target_id, data, confidence, status, created_at, expires_at) VALUES
('ai-001', 'product_recommendation', 'cust-001', '{"recommended_products": ["prod-004", "prod-018"], "reason": "Based on purchase history", "confidence_score": 0.85}', 0.85, 'active', datetime('now', '-2 days'), datetime('now', '+5 days')),
('ai-002', 'price_optimization', 'prod-005', '{"current_price": 24.99, "recommended_price": 27.99, "expected_increase": 12, "reason": "High demand, low stock"}', 0.78, 'active', datetime('now', '-1 day'), datetime('now', '+7 days')),
('ai-003', 'stock_prediction', 'prod-001', '{"current_stock": 25, "predicted_stock_out": "2024-12-10", "recommended_reorder": 50, "confidence": 0.92}', 0.92, 'active', datetime('now', '-1 hour'), datetime('now', '+14 days')),
('ai-004', 'customer_segment', 'cust-003', '{"segment": "high_value", "characteristics": ["frequent_buyer", "high_spending"], "recommended_offers": ["loyalty_bonus", "early_access"]}', 0.88, 'active', datetime('now', '-6 hours'), datetime('now', '+30 days'));

-- =====================================================
-- 16. FORECASTS (Sample predictions)
-- =====================================================

INSERT INTO forecasts (id, product_id, forecast_type, period_type, forecast_date, predicted_value, confidence_interval, actual_value, created_at) VALUES
('for-001', 'prod-001', 'sales', 'daily', DATE('now', '+1 day'), 2.5, 0.85, NULL, datetime('now')),
('for-002', 'prod-001', 'demand', 'weekly', DATE('now', '+7 days'), 15.0, 0.78, NULL, datetime('now')),
('for-003', 'prod-005', 'sales', 'daily', DATE('now', '+1 day'), 8.2, 0.72, NULL, datetime('now')),
('for-004', NULL, 'revenue', 'daily', DATE('now', '+1 day'), 2500.0, 0.80, NULL, datetime('now')),
('for-005', 'prod-003', 'stock', 'weekly', DATE('now', '+7 days'), 12.0, 0.88, NULL, datetime('now'));

-- =====================================================
-- FINAL UPDATES AND CALCULATIONS
-- =====================================================

-- Update product stock quantities based on sales
UPDATE products SET stock_quantity = 24 WHERE id = 'prod-001'; -- 1 sold
UPDATE products SET stock_quantity = 39 WHERE id = 'prod-004'; -- 1 sold  
UPDATE products SET stock_quantity = 98 WHERE id = 'prod-005'; -- 2 sold
UPDATE products SET stock_quantity = 44 WHERE id = 'prod-007'; -- 1 sold
UPDATE products SET stock_quantity = 14 WHERE id = 'prod-003'; -- 1 sold
UPDATE products SET stock_quantity = 195 WHERE id = 'prod-008'; -- 5 adjusted + 3 sold
UPDATE products SET stock_quantity = 117 WHERE id = 'prod-012'; -- 3 sold + 20 restocked

-- Update customer statistics based on orders
UPDATE customers SET 
  total_spent = 1319.97, 
  visit_count = 13, 
  loyalty_points = 282,
  last_visit = datetime('now', '-2 days')
WHERE id = 'cust-001';

UPDATE customers SET 
  total_spent = 1980.48, 
  visit_count = 9, 
  loyalty_points = 217,
  last_visit = datetime('now', '-1 day')
WHERE id = 'cust-003';

UPDATE customers SET 
  total_spent = 1656.22, 
  visit_count = 10, 
  loyalty_points = 110,
  last_visit = datetime('now', '-0.5 days')
WHERE id = 'cust-005';

UPDATE customers SET 
  total_spent = 1980.48, 
  visit_count = 9, 
  loyalty_points = 217,
  last_visit = datetime('now', '-0.2 days')
WHERE id = 'cust-002';

-- Insert some activity logs for recent actions
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_values, ip_address, created_at) VALUES
('cashier-001', 'order_created', 'order', 'ord-001', '{"total": 1319.97}', '192.168.1.100', datetime('now', '-2 days')),
('staff-001', 'order_created', 'order', 'ord-002', '{"total": 43.27}', '192.168.1.101', datetime('now', '-1 day')),
('cashier-002', 'order_created', 'order', 'ord-003', '{"total": 140.71}', '192.168.1.102', datetime('now', '-1 day')),
('admin-001', 'user_login', 'auth', 'admin-001', '{}', '192.168.1.1', datetime('now', '-1 hour')),
('staff-001', 'product_updated', 'product', 'prod-008', '{"stock_adjustment": -5}', '192.168.1.101', datetime('now', '-3 days'));

-- =====================================================
-- SEED DATA COMPLETE
-- Total Records Created:
-- - 6 Users (1 Admin, 2 Staff, 3 Cashiers)
-- - 6 Categories
-- - 20 Products 
-- - 10 Customers
-- - 6 Payment Methods
-- - 5 Staff Statistics
-- - 10 Badges
-- - 11 Achievements
-- - 5 Challenges
-- - 5 Orders with 10 Order Items
-- - 10 Inventory Logs
-- - 10 System Settings
-- - 5 Notifications
-- - 4 AI Recommendations
-- - 5 Forecasts
-- - Various Activity Logs
-- =====================================================

-- Demo login credentials:
-- Admin: admin@pos.com / admin123
-- Staff: john.staff@pos.com / staff123
-- Cashier: mike.cashier@pos.com / cashier123