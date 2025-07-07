-- ================================
-- ENTERPRISE POS DATABASE SEED v2.0.0
-- Sample data for testing and demo
-- ================================

-- Clear existing data (be careful in production!)
-- DELETE FROM organizations;

-- ================================
-- 1. SAMPLE ORGANIZATION & STORES
-- ================================

INSERT INTO organizations (name, slug, description, phone, email, address, city, country, settings) VALUES 
('TechMart Vietnam', 'techmart-vn', 'Leading technology retailer in Vietnam', '+84-28-1234-5678', 'info@techmart.vn', '123 Nguyen Hue Street', 'Ho Chi Minh City', 'VN', '{"features":{"ai_enabled":true,"gamification":true,"loyalty":true}}');

INSERT INTO stores (organization_id, name, code, address, city, manager_id, opening_hours, settings) VALUES 
(1, 'TechMart District 1', 'TM-D1', '123 Nguyen Hue Street, District 1', 'Ho Chi Minh City', 2, '{"monday":"09:00-22:00","tuesday":"09:00-22:00","wednesday":"09:00-22:00","thursday":"09:00-22:00","friday":"09:00-22:00","saturday":"09:00-23:00","sunday":"09:00-23:00"}', '{"pos_layout":"grid","receipt_footer":"Thank you for shopping at TechMart!"}'),
(1, 'TechMart District 3', 'TM-D3', '456 Vo Van Tan Street, District 3', 'Ho Chi Minh City', 3, '{"monday":"09:00-22:00","tuesday":"09:00-22:00","wednesday":"09:00-22:00","thursday":"09:00-22:00","friday":"09:00-22:00","saturday":"09:00-23:00","sunday":"09:00-23:00"}', '{"pos_layout":"list","receipt_footer":"Visit us again soon!"}'),
(1, 'TechMart District 7', 'TM-D7', '789 Nguyen Thi Thap Street, District 7', 'Ho Chi Minh City', 4, '{"monday":"10:00-22:00","tuesday":"10:00-22:00","wednesday":"10:00-22:00","thursday":"10:00-22:00","friday":"10:00-22:00","saturday":"10:00-23:00","sunday":"10:00-23:00"}', '{"pos_layout":"grid","receipt_footer":"TechMart - Technology for Everyone"}');

-- ================================
-- 2. SAMPLE USERS (Staff Members)
-- ================================

-- Super Admin
INSERT INTO users (organization_id, store_id, username, email, password_hash, first_name, last_name, phone, role, employee_id, hire_date, settings) VALUES 
(1, 1, 'admin', 'admin@pos.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Admin', 'User', '+84-901-234-567', 'super_admin', 'EMP001', '2024-01-01', '{"theme":"dark","notifications":true}');

-- Store Managers
INSERT INTO users (organization_id, store_id, username, email, password_hash, first_name, last_name, phone, role, employee_id, hire_date, salary, settings) VALUES 
(1, 1, 'manager1', 'manager1@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Nguyen', 'Van Manager', '+84-901-234-568', 'manager', 'EMP002', '2024-01-01', 25000000, '{"dashboard_layout":"advanced","email_notifications":true}'),
(1, 2, 'manager2', 'manager2@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Tran', 'Thi Manager', '+84-901-234-569', 'manager', 'EMP003', '2024-01-01', 25000000, '{"dashboard_layout":"simple","email_notifications":true}'),
(1, 3, 'manager3', 'manager3@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Le', 'Van Manager', '+84-901-234-570', 'manager', 'EMP004', '2024-01-01', 25000000, '{"dashboard_layout":"advanced","email_notifications":false}');

-- Shift Supervisors
INSERT INTO users (organization_id, store_id, username, email, password_hash, first_name, last_name, phone, role, employee_id, hire_date, salary, commission_rate, settings) VALUES 
(1, 1, 'supervisor1', 'supervisor1@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Pham', 'Van Supervisor', '+84-901-234-571', 'shift_supervisor', 'EMP005', '2024-01-15', 18000000, 0.02, '{"pos_shortcuts":["products","customers","reports"]}'),
(1, 2, 'supervisor2', 'supervisor2@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Hoang', 'Thi Supervisor', '+84-901-234-572', 'shift_supervisor', 'EMP006', '2024-01-15', 18000000, 0.02, '{"pos_shortcuts":["sales","inventory","customers"]}');

-- Senior Cashiers
INSERT INTO users (organization_id, store_id, username, email, password_hash, first_name, last_name, phone, role, employee_id, hire_date, salary, commission_rate, settings) VALUES 
(1, 1, 'cashier1', 'cashier1@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Vo', 'Thi Senior', '+84-901-234-573', 'senior_cashier', 'EMP007', '2024-02-01', 15000000, 0.015, '{"pos_layout":"compact","quick_actions":true}'),
(1, 2, 'cashier2', 'cashier2@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Dang', 'Van Senior', '+84-901-234-574', 'senior_cashier', 'EMP008', '2024-02-01', 15000000, 0.015, '{"pos_layout":"standard","receipt_printer":"thermal"}');

-- Regular Cashiers
INSERT INTO users (organization_id, store_id, username, email, password_hash, first_name, last_name, phone, role, employee_id, hire_date, salary, commission_rate, settings) VALUES 
(1, 1, 'cashier3', 'cashier3@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Bui', 'Thi Cashier', '+84-901-234-575', 'cashier', 'EMP009', '2024-03-01', 12000000, 0.01, '{"training_mode":false,"daily_target":500000}'),
(1, 1, 'cashier4', 'cashier4@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Do', 'Van Cashier', '+84-901-234-576', 'cashier', 'EMP010', '2024-03-01', 12000000, 0.01, '{"training_mode":false,"daily_target":500000}'),
(1, 2, 'cashier5', 'cashier5@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Ngo', 'Thi Cashier', '+84-901-234-577', 'cashier', 'EMP011', '2024-03-15', 12000000, 0.01, '{"training_mode":true,"daily_target":300000}');

-- Sales Staff
INSERT INTO users (organization_id, store_id, username, email, password_hash, first_name, last_name, phone, role, employee_id, hire_date, salary, commission_rate, settings) VALUES 
(1, 1, 'sales1', 'sales1@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Ly', 'Van Sales', '+84-901-234-578', 'sales_staff', 'EMP012', '2024-02-15', 13000000, 0.03, '{"specialization":"smartphones","monthly_target":50000000}'),
(1, 1, 'sales2', 'sales2@techmart.vn', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LgBz5AhQ7cXJZqBXK', 'Duong', 'Thi Sales', '+84-901-234-579', 'sales_staff', 'EMP013', '2024-02-15', 13000000, 0.03, '{"specialization":"laptops","monthly_target":60000000}');

-- Update store managers
UPDATE stores SET manager_id = 2 WHERE id = 1;
UPDATE stores SET manager_id = 3 WHERE id = 2;
UPDATE stores SET manager_id = 4 WHERE id = 3;

-- ================================
-- 3. PRODUCT CATEGORIES & BRANDS
-- ================================

INSERT INTO categories (organization_id, name, description, sort_order) VALUES 
(1, 'Smartphones', 'Mobile phones and accessories', 1),
(1, 'Laptops', 'Portable computers and notebooks', 2),
(1, 'Tablets', 'Tablet computers and e-readers', 3),
(1, 'Audio', 'Headphones, speakers, and audio devices', 4),
(1, 'Gaming', 'Gaming consoles, controllers, and accessories', 5),
(1, 'Accessories', 'Phone cases, chargers, and cables', 6),
(1, 'Smart Home', 'IoT devices and smart home products', 7),
(1, 'Computers', 'Desktop computers and components', 8);

INSERT INTO brands (organization_id, name, description) VALUES 
(1, 'Apple', 'Premium technology products'),
(1, 'Samsung', 'Innovative mobile and electronic devices'),
(1, 'Xiaomi', 'High-quality affordable technology'),
(1, 'OPPO', 'Smartphone and audio technology'),
(1, 'Vivo', 'Mobile photography and innovation'),
(1, 'Huawei', 'Telecommunications and consumer electronics'),
(1, 'Dell', 'Personal computers and enterprise solutions'),
(1, 'HP', 'Computing and printing technologies'),
(1, 'Asus', 'Computer hardware and electronics'),
(1, 'Lenovo', 'Personal computers and mobile devices'),
(1, 'Sony', 'Audio, gaming, and entertainment electronics'),
(1, 'JBL', 'Audio equipment and speakers'),
(1, 'Anker', 'Charging technology and accessories'),
(1, 'Baseus', 'Mobile accessories and charging solutions');

INSERT INTO suppliers (organization_id, name, contact_person, email, phone, address, payment_terms) VALUES 
(1, 'Tech Distribution Co.', 'Nguyen Van Supplier', 'supplier1@techdist.vn', '+84-28-7777-8888', '789 Le Lai Street, District 1, HCMC', 'Net 30'),
(1, 'Mobile World Wholesale', 'Tran Thi Wholesale', 'wholesale@mobileworld.vn', '+84-28-9999-0000', '456 Cach Mang Thang 8, District 3, HCMC', 'Net 15'),
(1, 'Electronics Import Ltd', 'Le Van Import', 'import@electronics.vn', '+84-28-1111-2222', '123 Ton Duc Thang, District 1, HCMC', 'Net 45');

-- ================================
-- 4. SAMPLE PRODUCTS
-- ================================

-- Smartphones
INSERT INTO products (organization_id, category_id, brand_id, supplier_id, sku, barcode, name, description, cost_price, selling_price, compare_price, weight, min_stock_level, attributes, tags) VALUES 
(1, 1, 1, 1, 'IPH15-128-BK', '1234567890123', 'iPhone 15 128GB Black', 'Latest iPhone with A17 Pro chip and advanced camera system', 18000000, 25000000, 27000000, 171, 5, '{"color":"Black","storage":"128GB","network":"5G"}', '["flagship","5g","wireless-charging"]'),
(1, 1, 1, 1, 'IPH15-256-BL', '1234567890124', 'iPhone 15 256GB Blue', 'Latest iPhone with A17 Pro chip, 256GB storage', 20000000, 28000000, 30000000, 171, 5, '{"color":"Blue","storage":"256GB","network":"5G"}', '["flagship","5g","wireless-charging"]'),
(1, 1, 2, 1, 'SGS24-128-GY', '2345678901234', 'Samsung Galaxy S24 128GB Gray', 'Premium Android smartphone with advanced AI features', 15000000, 22000000, 24000000, 167, 8, '{"color":"Gray","storage":"128GB","network":"5G"}', '["android","5g","ai-camera"]'),
(1, 1, 3, 2, 'XMI14-256-BK', '3456789012345', 'Xiaomi 14 256GB Black', 'Flagship Xiaomi with Snapdragon 8 Gen 3', 12000000, 18000000, 20000000, 193, 10, '{"color":"Black","storage":"256GB","network":"5G"}', '["xiaomi","performance","value"]'),
(1, 1, 4, 2, 'OPF5-128-GR', '4567890123456', 'OPPO Find X5 128GB Green', 'Photography-focused smartphone with premium design', 11000000, 16000000, 18000000, 196, 8, '{"color":"Green","storage":"128GB","network":"5G"}', '["camera","design","oppo"]'),
(1, 1, 5, 2, 'VIV30-256-PL', '5678901234567', 'Vivo V30 256GB Purple', 'Selfie-centric phone with elegant design', 9000000, 14000000, 16000000, 186, 10, '{"color":"Purple","storage":"256GB","network":"5G"}', '["selfie","design","vivo"]');

-- Laptops
INSERT INTO products (organization_id, category_id, brand_id, supplier_id, sku, barcode, name, description, cost_price, selling_price, compare_price, weight, min_stock_level, attributes, tags) VALUES 
(1, 2, 1, 1, 'MBA-M2-256-SV', '6789012345678', 'MacBook Air M2 256GB Silver', '13-inch MacBook Air with M2 chip and stunning display', 22000000, 28000000, 30000000, 1240, 3, '{"processor":"M2","storage":"256GB","screen":"13-inch","color":"Silver"}', '["apple","laptop","portable"]'),
(1, 2, 7, 3, 'DLL-XPS13-512', '7890123456789', 'Dell XPS 13 512GB', 'Ultra-portable laptop with Intel Core i7', 20000000, 26000000, 28000000, 1200, 3, '{"processor":"Intel i7","storage":"512GB","screen":"13-inch","color":"Platinum"}', '["dell","business","portable"]'),
(1, 2, 8, 3, 'HP-SPEC-1TB', '8901234567890', 'HP Spectre x360 1TB', 'Convertible laptop with premium design', 25000000, 32000000, 35000000, 1300, 2, '{"processor":"Intel i7","storage":"1TB","screen":"14-inch","color":"Dark Blue"}', '["hp","convertible","premium"]'),
(1, 2, 9, 3, 'ASUS-ZB14-512', '9012345678901', 'ASUS ZenBook 14 512GB', 'Lightweight laptop for productivity', 18000000, 24000000, 26000000, 1100, 4, '{"processor":"AMD Ryzen 7","storage":"512GB","screen":"14-inch","color":"Pine Gray"}', '["asus","amd","productivity"]');

-- Tablets
INSERT INTO products (organization_id, category_id, brand_id, supplier_id, sku, barcode, name, description, cost_price, selling_price, compare_price, weight, min_stock_level, attributes, tags) VALUES 
(1, 3, 1, 1, 'IPAD-AIR-256', '0123456789012', 'iPad Air 256GB WiFi', '10.9-inch iPad Air with M1 chip', 14000000, 18000000, 20000000, 461, 5, '{"processor":"M1","storage":"256GB","screen":"10.9-inch","connectivity":"WiFi"}', '["ipad","tablet","creative"]'),
(1, 3, 2, 1, 'SGT-TAB-128', '1234567890234', 'Samsung Galaxy Tab S9 128GB', 'Premium Android tablet with S Pen', 12000000, 16000000, 18000000, 498, 5, '{"processor":"Snapdragon 8 Gen 2","storage":"128GB","screen":"11-inch","accessories":"S Pen"}', '["samsung","android","stylus"]');

-- Audio Products
INSERT INTO products (organization_id, category_id, brand_id, supplier_id, sku, barcode, name, description, cost_price, selling_price, compare_price, weight, min_stock_level, attributes, tags) VALUES 
(1, 4, 1, 1, 'AIRPODS-PRO2', '2345678901345', 'AirPods Pro 2nd Gen', 'Premium wireless earbuds with active noise cancellation', 4500000, 6000000, 6500000, 50.8, 15, '{"type":"True Wireless","features":"ANC","battery":"30 hours"}', '["airpods","wireless","anc"]'),
(1, 4, 11, 2, 'SONY-WH1000XM5', '3456789012456', 'Sony WH-1000XM5', 'Industry-leading noise canceling headphones', 6000000, 8500000, 9000000, 250, 8, '{"type":"Over-ear","features":"ANC","battery":"30 hours"}', '["sony","headphones","anc"]'),
(1, 4, 12, 2, 'JBL-FLIP6-BL', '4567890123567', 'JBL Flip 6 Blue', 'Portable waterproof Bluetooth speaker', 1800000, 2500000, 2800000, 550, 20, '{"type":"Portable Speaker","features":"Waterproof","battery":"12 hours","color":"Blue"}', '["jbl","speaker","waterproof"]');

-- Gaming
INSERT INTO products (organization_id, category_id, brand_id, supplier_id, sku, barcode, name, description, cost_price, selling_price, compare_price, weight, min_stock_level, attributes, tags) VALUES 
(1, 5, 11, 1, 'PS5-CONSOLE', '5678901234678', 'PlayStation 5 Console', 'Next-gen gaming console with ultra-fast SSD', 11000000, 15000000, 16000000, 4200, 2, '{"storage":"825GB SSD","features":"4K Gaming","accessories":"DualSense Controller"}', '["playstation","gaming","console"]'),
(1, 5, 11, 1, 'PS5-CONTROLLER', '6789012345789', 'DualSense Wireless Controller', 'Advanced haptic feedback gaming controller', 1200000, 1800000, 2000000, 280, 10, '{"type":"Wireless Controller","features":"Haptic Feedback","compatibility":"PS5"}', '["controller","gaming","wireless"]');

-- Accessories
INSERT INTO products (organization_id, category_id, brand_id, supplier_id, sku, barcode, name, description, cost_price, selling_price, compare_price, weight, min_stock_level, attributes, tags) VALUES 
(1, 6, 13, 2, 'ANK-PD65W', '7890123456890', 'Anker PowerDelivery 65W Charger', 'Fast charging adapter with USB-C PD', 800000, 1200000, 1400000, 200, 25, '{"power":"65W","ports":"USB-C","features":"PowerDelivery"}', '["charger","usb-c","fast-charging"]'),
(1, 6, 14, 2, 'BAS-CABLE-2M', '8901234567901', 'Baseus USB-C Cable 2M', 'High-quality braided charging cable', 200000, 350000, 400000, 150, 50, '{"length":"2 meters","type":"USB-C","features":"Braided"}', '["cable","usb-c","durable"]'),
(1, 6, 13, 2, 'ANK-BANK-20K', '9012345678012', 'Anker PowerCore 20000mAh', 'High-capacity portable power bank', 1000000, 1500000, 1700000, 355, 15, '{"capacity":"20000mAh","ports":"USB-A, USB-C","features":"Fast Charging"}', '["powerbank","portable","anker"]');

-- ================================
-- 5. INVENTORY SETUP
-- ================================

-- Store 1 Inventory
INSERT INTO inventory (organization_id, store_id, product_id, quantity_on_hand, reorder_point, max_stock_level) VALUES 
(1, 1, 1, 15, 5, 30),    -- iPhone 15 128GB Black
(1, 1, 2, 8, 3, 20),     -- iPhone 15 256GB Blue  
(1, 1, 3, 25, 8, 50),    -- Samsung Galaxy S24
(1, 1, 4, 30, 10, 60),   -- Xiaomi 14
(1, 1, 5, 20, 8, 40),    -- OPPO Find X5
(1, 1, 6, 18, 10, 35),   -- Vivo V30
(1, 1, 7, 5, 3, 15),     -- MacBook Air M2
(1, 1, 8, 8, 3, 20),     -- Dell XPS 13
(1, 1, 9, 3, 2, 10),     -- HP Spectre x360
(1, 1, 10, 12, 4, 25),   -- ASUS ZenBook 14
(1, 1, 11, 10, 5, 20),   -- iPad Air
(1, 1, 12, 15, 5, 30),   -- Samsung Galaxy Tab S9
(1, 1, 13, 45, 15, 80),  -- AirPods Pro 2
(1, 1, 14, 20, 8, 40),   -- Sony WH-1000XM5
(1, 1, 15, 35, 20, 70),  -- JBL Flip 6
(1, 1, 16, 3, 2, 8),     -- PlayStation 5
(1, 1, 17, 25, 10, 50),  -- DualSense Controller
(1, 1, 18, 60, 25, 100), -- Anker 65W Charger
(1, 1, 19, 80, 50, 150), -- Baseus USB-C Cable
(1, 1, 20, 40, 15, 80);  -- Anker PowerCore 20K

-- Store 2 Inventory (similar but different quantities)
INSERT INTO inventory (organization_id, store_id, product_id, quantity_on_hand, reorder_point, max_stock_level) VALUES 
(1, 2, 1, 12, 5, 25),    
(1, 2, 2, 6, 3, 15),     
(1, 2, 3, 20, 8, 45),    
(1, 2, 4, 35, 10, 70),   
(1, 2, 5, 15, 8, 35),    
(1, 2, 6, 22, 10, 40),   
(1, 2, 7, 4, 3, 12),     
(1, 2, 8, 6, 3, 18),     
(1, 2, 9, 2, 2, 8),      
(1, 2, 10, 10, 4, 22),   
(1, 2, 11, 8, 5, 18),    
(1, 2, 12, 12, 5, 25),   
(1, 2, 13, 38, 15, 70),  
(1, 2, 14, 15, 8, 35),   
(1, 2, 15, 28, 20, 60),  
(1, 2, 16, 2, 2, 6),     
(1, 2, 17, 20, 10, 45),  
(1, 2, 18, 55, 25, 90),  
(1, 2, 19, 75, 50, 140), 
(1, 2, 20, 35, 15, 75);  

-- ================================
-- 6. SAMPLE CUSTOMERS
-- ================================

INSERT INTO customers (organization_id, customer_number, first_name, last_name, email, phone, date_of_birth, gender, address, city, customer_group, loyalty_points, total_spent, total_orders, is_vip, preferences, notes) VALUES 
(1, 'CUST000001', 'Nguyen', 'Van A', 'nguyenvana@email.com', '+84-901-111-111', '1985-06-15', 'male', '123 Le Loi Street, District 1', 'Ho Chi Minh City', 'vip', 2500, 45000000, 18, TRUE, '{"preferred_brands":["Apple","Samsung"],"communication":"email"}', 'VIP customer, prefers premium products'),
(1, 'CUST000002', 'Tran', 'Thi B', 'tranthib@email.com', '+84-902-222-222', '1990-03-22', 'female', '456 Nguyen Hue Street, District 1', 'Ho Chi Minh City', 'regular', 1200, 18000000, 12, FALSE, '{"preferred_brands":["Xiaomi","OPPO"],"communication":"sms"}', 'Tech enthusiast, likes latest gadgets'),
(1, 'CUST000003', 'Le', 'Van C', 'levanc@email.com', '+84-903-333-333', '1988-12-10', 'male', '789 Dong Khoi Street, District 1', 'Ho Chi Minh City', 'premium', 1800, 32000000, 15, TRUE, '{"preferred_brands":["Apple","Sony"],"communication":"email"}', 'Business professional, frequent buyer'),
(1, 'CUST000004', 'Pham', 'Thi D', 'phamthid@email.com', '+84-904-444-444', '1995-08-05', 'female', '321 Ham Nghi Street, District 1', 'Ho Chi Minh City', 'student', 450, 8500000, 6, FALSE, '{"preferred_brands":["Xiaomi","Vivo"],"communication":"app"}', 'Student, budget-conscious buyer'),
(1, 'CUST000005', 'Hoang', 'Van E', 'hoangvane@email.com', '+84-905-555-555', '1982-11-30', 'male', '654 Vo Van Tan Street, District 3', 'Ho Chi Minh City', 'vip', 3200, 58000000, 22, TRUE, '{"preferred_brands":["Apple","Dell","Sony"],"communication":"email"}', 'Tech company owner, bulk purchases');

-- ================================
-- 7. SAMPLE ORDERS & TRANSACTIONS
-- ================================

-- Sample orders from the past month
INSERT INTO orders (organization_id, store_id, order_number, customer_id, cashier_id, order_type, status, subtotal, discount_amount, tax_amount, total_amount, paid_amount, payment_status, points_earned, notes, created_at) VALUES 
(1, 1, 'ORD-20250101-001', 1, 7, 'sale', 'completed', 25000000, 0, 2500000, 27500000, 27500000, 'paid', 250, 'VIP customer purchase', '2025-01-01 10:30:00'),
(1, 1, 'ORD-20250101-002', 2, 8, 'sale', 'completed', 18000000, 900000, 1710000, 18810000, 18810000, 'paid', 180, 'First-time customer discount applied', '2025-01-01 14:15:00'),
(1, 1, 'ORD-20250102-001', 3, 7, 'sale', 'completed', 32000000, 1600000, 3040000, 33440000, 33440000, 'paid', 320, 'Business bulk purchase', '2025-01-02 09:45:00'),
(1, 2, 'ORD-20250102-002', 4, 9, 'sale', 'completed', 14000000, 700000, 1330000, 14630000, 14630000, 'paid', 140, 'Student discount applied', '2025-01-02 16:20:00'),
(1, 1, 'ORD-20250103-001', 5, 10, 'sale', 'completed', 28000000, 0, 2800000, 30800000, 30800000, 'paid', 280, 'MacBook Air purchase', '2025-01-03 11:10:00');

-- Order items for the above orders
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_amount, cost_price) VALUES 
-- Order 1: iPhone 15 128GB Black
(1, 1, 1, 25000000, 25000000, 18000000),

-- Order 2: Xiaomi 14 (with discount)
(2, 4, 1, 18000000, 17100000, 12000000),

-- Order 3: MacBook Air M2 + iPad Air
(3, 7, 1, 28000000, 28000000, 22000000),
(3, 11, 1, 18000000, 18000000, 14000000),

-- Order 4: Vivo V30 (student discount)
(4, 6, 1, 14000000, 13300000, 9000000),

-- Order 5: MacBook Air M2
(5, 7, 1, 28000000, 28000000, 22000000);

-- Sample payments
INSERT INTO payments (order_id, payment_method, amount, status, processed_at) VALUES 
(1, 'card', 27500000, 'completed', '2025-01-01 10:32:00'),
(2, 'cash', 18810000, 'completed', '2025-01-01 14:17:00'),
(3, 'card', 33440000, 'completed', '2025-01-02 09:47:00'),
(4, 'digital', 14630000, 'completed', '2025-01-02 16:22:00'),
(5, 'card', 30800000, 'completed', '2025-01-03 11:12:00');

-- ================================
-- 8. GAMIFICATION SETUP
-- ================================

-- Sample achievements
INSERT INTO achievements (organization_id, name, description, icon, category, condition_type, condition_value, condition_period, points_reward) VALUES 
(1, 'First Sale', 'Complete your first sale', '🎯', 'sales', 'sales_count', 1, 'all_time', 10),
(1, 'Sales Rookie', 'Complete 10 sales in a month', '🏆', 'sales', 'sales_count', 10, 'monthly', 50),
(1, 'Revenue Champion', 'Generate 50M VND in sales in a month', '💰', 'sales', 'sales_amount', 50000000, 'monthly', 200),
(1, 'Customer Favorite', 'Serve 100 customers in a month', '❤️', 'customer_service', 'customer_count', 100, 'monthly', 100),
(1, 'Perfect Week', 'Zero mistakes for a week', '⭐', 'performance', 'error_rate', 0, 'weekly', 75),
(1, 'Early Bird', 'Arrive on time for 30 days', '🌅', 'attendance', 'days_present', 30, 'monthly', 80),
(1, 'Team Player', 'Help colleagues 20 times', '🤝', 'teamwork', 'help_count', 20, 'monthly', 60),
(1, 'Tech Expert', 'Complete product training', '🎓', 'training', 'training_complete', 1, 'all_time', 150);

-- Award some achievements to users
INSERT INTO user_achievements (user_id, achievement_id, earned_at, progress_value) VALUES 
(7, 1, '2024-02-01 09:00:00', 1),  -- Cashier1 - First Sale
(7, 2, '2024-03-01 18:00:00', 15), -- Cashier1 - Sales Rookie
(8, 1, '2024-02-01 10:30:00', 1),  -- Cashier2 - First Sale
(8, 2, '2024-03-15 17:00:00', 12), -- Cashier2 - Sales Rookie
(12, 1, '2024-02-15 11:00:00', 1), -- Sales1 - First Sale
(12, 3, '2024-03-31 20:00:00', 52000000), -- Sales1 - Revenue Champion
(13, 1, '2024-02-15 14:00:00', 1), -- Sales2 - First Sale
(13, 3, '2024-03-31 20:00:00', 48000000); -- Sales2 - Almost Revenue Champion

-- Sample gamification stats
INSERT INTO gamification_stats (user_id, period_type, period_date, total_sales, total_orders, total_customers, points_earned, rank_position) VALUES 
(7, 'monthly', '2025-01-01', 15000000, 25, 20, 150, 3),  -- Cashier1 Jan stats
(8, 'monthly', '2025-01-01', 18000000, 30, 25, 180, 2),  -- Cashier2 Jan stats  
(12, 'monthly', '2025-01-01', 35000000, 15, 15, 350, 1), -- Sales1 Jan stats
(13, 'monthly', '2025-01-01', 28000000, 12, 12, 280, 4), -- Sales2 Jan stats
(9, 'monthly', '2025-01-01', 12000000, 20, 18, 120, 5);  -- Cashier3 Jan stats

-- ================================
-- 9. LOYALTY PROGRAM SETUP
-- ================================

INSERT INTO loyalty_programs (organization_id, name, description, points_per_currency, currency_per_point, tier_thresholds, rules) VALUES 
(1, 'TechMart Rewards', 'Earn points on every purchase and unlock exclusive benefits', 0.001, 1000, '{"silver":5000000,"gold":20000000,"platinum":50000000}', '{"point_expiry":365,"birthday_bonus":2,"referral_points":500}');

-- Sample loyalty transactions
INSERT INTO loyalty_transactions (customer_id, order_id, transaction_type, points, description) VALUES 
(1, 1, 'earned', 250, 'Points earned from purchase'),
(2, 2, 'earned', 180, 'Points earned from purchase'),
(3, 3, 'earned', 320, 'Points earned from purchase'),
(4, 4, 'earned', 140, 'Points earned from purchase'),
(5, 5, 'earned', 280, 'Points earned from purchase');

-- ================================
-- 10. PROMOTIONS & DISCOUNTS
-- ================================

INSERT INTO promotions (organization_id, name, description, type, value, minimum_amount, usage_limit, start_date, end_date, applicable_categories) VALUES 
(1, 'New Year Sale', '10% off on all smartphones', 'percentage', 10, 10000000, 1000, '2025-01-01 00:00:00', '2025-01-31 23:59:59', '[1]'),
(1, 'Student Discount', '5% off for students', 'percentage', 5, 5000000, 500, '2025-01-01 00:00:00', '2025-12-31 23:59:59', '[]'),
(1, 'VIP Exclusive', '15% off for VIP customers', 'percentage', 15, 20000000, 200, '2025-01-01 00:00:00', '2025-03-31 23:59:59', '[]'),
(1, 'Bundle Deal', '1M VND off when buying laptop + accessories', 'fixed_amount', 1000000, 25000000, 100, '2025-01-15 00:00:00', '2025-02-15 23:59:59', '[2,6]');

-- ================================
-- 11. ANALYTICS DATA
-- ================================

-- Sample daily analytics for the past week
INSERT INTO analytics_daily (organization_id, store_id, date, total_sales, total_orders, total_customers, new_customers, average_order_value, total_profit, profit_margin, total_discounts, payment_method_breakdown) VALUES 
(1, 1, '2025-01-01', 27500000, 1, 1, 0, 27500000, 9500000, 34.5, 0, '{"card":27500000}'),
(1, 1, '2025-01-02', 33440000, 1, 1, 0, 33440000, 11440000, 34.2, 1600000, '{"card":33440000}'),
(1, 1, '2025-01-03', 30800000, 1, 1, 0, 30800000, 8800000, 28.6, 0, '{"card":30800000}'),
(1, 2, '2025-01-01', 18810000, 1, 1, 0, 18810000, 5710000, 30.3, 900000, '{"cash":18810000}'),
(1, 2, '2025-01-02', 14630000, 1, 1, 0, 14630000, 4630000, 31.7, 700000, '{"digital":14630000}');

-- Sample stock movements
INSERT INTO stock_movements (organization_id, store_id, product_id, movement_type, quantity, previous_quantity, new_quantity, unit_cost, total_cost, reference_type, reference_id, reason, created_by) VALUES 
(1, 1, 1, 'out', -1, 16, 15, 18000000, 18000000, 'order', 1, 'Sale to customer', 7),
(1, 1, 4, 'out', -1, 31, 30, 12000000, 12000000, 'order', 2, 'Sale to customer', 8),
(1, 1, 7, 'out', -1, 6, 5, 22000000, 22000000, 'order', 3, 'Sale to customer', 7),
(1, 1, 11, 'out', -1, 11, 10, 14000000, 14000000, 'order', 3, 'Sale to customer', 7),
(1, 2, 6, 'out', -1, 16, 15, 9000000, 9000000, 'order', 4, 'Sale to customer', 9),
(1, 1, 7, 'out', -1, 5, 4, 22000000, 22000000, 'order', 5, 'Sale to customer', 10);

-- ================================
-- UPDATE SEQUENCES (SQLite auto-increment)
-- ================================

-- Note: SQLite handles auto-increment automatically, no manual sequence updates needed

-- ================================
-- FINAL DATA VERIFICATION
-- ================================

-- Verify record counts
SELECT 
    'organizations' as table_name, COUNT(*) as record_count FROM organizations
UNION ALL SELECT 'stores', COUNT(*) FROM stores
UNION ALL SELECT 'users', COUNT(*) FROM users  
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'brands', COUNT(*) FROM brands
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL SELECT 'user_achievements', COUNT(*) FROM user_achievements
UNION ALL SELECT 'loyalty_transactions', COUNT(*) FROM loyalty_transactions
UNION ALL SELECT 'promotions', COUNT(*) FROM promotions
UNION ALL SELECT 'analytics_daily', COUNT(*) FROM analytics_daily
UNION ALL SELECT 'stock_movements', COUNT(*) FROM stock_movements;