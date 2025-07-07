/**
 * Cloudflare D1 Database Service
 * Provides abstraction layer for database operations
 */

export class DatabaseService {
    constructor(db) {
      this.db = db
    }
    
    static initialize(env) {
      return new DatabaseService(env.DB)
    }
    
    // ==========================================
    // QUERY BUILDERS & HELPERS
    // ==========================================
    
    /**
     * Execute a prepared statement with error handling
     */
    async execute(query, params = []) {
      try {
        const stmt = this.db.prepare(query)
        return await stmt.bind(...params).run()
      } catch (error) {
        console.error('Database execute error:', error)
        throw new DatabaseError(`Query execution failed: ${error.message}`)
      }
    }
    
    /**
     * Get first result from query
     */
    async first(query, params = []) {
      try {
        const stmt = this.db.prepare(query)
        return await stmt.bind(...params).first()
      } catch (error) {
        console.error('Database first error:', error)
        throw new DatabaseError(`Query execution failed: ${error.message}`)
      }
    }
    
    /**
     * Get all results from query
     */
    async all(query, params = []) {
      try {
        const stmt = this.db.prepare(query)
        const result = await stmt.bind(...params).all()
        return result.results || []
      } catch (error) {
        console.error('Database all error:', error)
        throw new DatabaseError(`Query execution failed: ${error.message}`)
      }
    }
    
    /**
     * Execute query in transaction
     */
    async transaction(queries) {
      try {
        const statements = queries.map(({ query, params = [] }) => 
          this.db.prepare(query).bind(...params)
        )
        return await this.db.batch(statements)
      } catch (error) {
        console.error('Database transaction error:', error)
        throw new DatabaseError(`Transaction failed: ${error.message}`)
      }
    }
    
    /**
     * Build dynamic WHERE clause
     */
    buildWhereClause(conditions) {
      const clauses = []
      const params = []
      
      Object.entries(conditions).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            clauses.push(`${key} IN (${value.map(() => '?').join(',')})`)
            params.push(...value)
          } else if (typeof value === 'string' && value.includes('%')) {
            clauses.push(`${key} LIKE ?`)
            params.push(value)
          } else {
            clauses.push(`${key} = ?`)
            params.push(value)
          }
        }
      })
      
      return {
        clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
        params
      }
    }
    
    /**
     * Build pagination query
     */
    buildPagination(page = 1, limit = 20) {
      const offset = (parseInt(page) - 1) * parseInt(limit)
      return {
        limit: parseInt(limit),
        offset,
        clause: `LIMIT ? OFFSET ?`,
        params: [parseInt(limit), offset]
      }
    }
    
    // ==========================================
    // USER OPERATIONS
    // ==========================================
    
    async createUser(userData) {
      const query = `
        INSERT INTO users (id, email, password_hash, name, role, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `
      return await this.execute(query, [
        userData.id,
        userData.email,
        userData.password_hash,
        userData.name,
        userData.role,
        userData.phone || null
      ])
    }
    
    async getUserByEmail(email) {
      const query = `
        SELECT id, email, password_hash, name, role, is_active, last_login
        FROM users 
        WHERE email = ? AND is_active = 1
      `
      return await this.first(query, [email])
    }
    
    async getUserById(id) {
      const query = `
        SELECT id, email, name, role, phone, avatar_url, is_active, last_login, created_at
        FROM users 
        WHERE id = ? AND is_active = 1
      `
      return await this.first(query, [id])
    }
    
    async updateUserLastLogin(userId) {
      const query = `
        UPDATE users 
        SET last_login = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `
      return await this.execute(query, [userId])
    }
    
    // ==========================================
    // PRODUCT OPERATIONS
    // ==========================================
    
    async getProducts(filters = {}) {
      const { clause: whereClause, params: whereParams } = this.buildWhereClause({
        'p.category_id': filters.category_id,
        'p.is_active': filters.is_active,
        'p.name': filters.search ? `%${filters.search}%` : undefined
      })
      
      const { clause: paginationClause, params: paginationParams } = this.buildPagination(
        filters.page,
        filters.limit
      )
      
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          c.color as category_color,
          CASE WHEN p.stock_quantity <= p.reorder_level THEN 1 ELSE 0 END as is_low_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ORDER BY p.name ASC
        ${paginationClause}
      `
      
      return await this.all(query, [...whereParams, ...paginationParams])
    }
    
    async getProductById(productId) {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          c.color as category_color,
          CASE WHEN p.stock_quantity <= p.reorder_level THEN 1 ELSE 0 END as is_low_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `
      return await this.first(query, [productId])
    }
    
    async getProductByBarcode(barcode) {
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          c.color as category_color,
          CASE WHEN p.stock_quantity <= p.reorder_level THEN 1 ELSE 0 END as is_low_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.barcode = ? AND p.is_active = 1
      `
      return await this.first(query, [barcode])
    }
    
    async createProduct(productData) {
      const query = `
        INSERT INTO products (
          id, sku, name, description, category_id, price, cost_price,
          stock_quantity, reorder_level, barcode, image_url, weight,
          dimensions, tax_rate, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `
      return await this.execute(query, [
        productData.id,
        productData.sku,
        productData.name,
        productData.description || null,
        productData.category_id || null,
        productData.price,
        productData.cost_price || null,
        productData.stock_quantity || 0,
        productData.reorder_level || 10,
        productData.barcode || null,
        productData.image_url || null,
        productData.weight || null,
        productData.dimensions || null,
        productData.tax_rate || 0
      ])
    }
    
    async updateProductStock(productId, newQuantity) {
      const query = `
        UPDATE products 
        SET stock_quantity = ?, updated_at = datetime('now')
        WHERE id = ?
      `
      return await this.execute(query, [newQuantity, productId])
    }
    
    async getLowStockProducts() {
      const query = `
        SELECT 
          p.*,
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.stock_quantity <= p.reorder_level 
          AND p.is_active = 1
        ORDER BY p.stock_quantity ASC
      `
      return await this.all(query)
    }
    
    // ==========================================
    // ORDER OPERATIONS
    // ==========================================
    
    async createOrder(orderData) {
      const queries = [
        {
          query: `
            INSERT INTO orders (
              id, order_number, customer_id, cashier_id, subtotal, tax_amount,
              discount_amount, total_amount, payment_method, payment_status,
              order_status, notes, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `,
          params: [
            orderData.id,
            orderData.order_number,
            orderData.customer_id || null,
            orderData.cashier_id,
            orderData.subtotal,
            orderData.tax_amount,
            orderData.discount_amount,
            orderData.total_amount,
            orderData.payment_method,
            orderData.payment_status || 'completed',
            orderData.order_status || 'completed',
            orderData.notes || null
          ]
        }
      ]
      
      // Add order items
      orderData.items.forEach(item => {
        queries.push({
          query: `
            INSERT INTO order_items (
              id, order_id, product_id, quantity, unit_price, 
              subtotal, discount_amount, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `,
          params: [
            item.id,
            orderData.id,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.subtotal,
            item.discount_amount || 0
          ]
        })
      })
      
      return await this.transaction(queries)
    }
    
    async getOrderById(orderId) {
      const query = `
        SELECT 
          o.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          u.name as cashier_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users u ON o.cashier_id = u.id
        WHERE o.id = ?
      `
      return await this.first(query, [orderId])
    }
    
    async getOrderItems(orderId) {
      const query = `
        SELECT 
          oi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.image_url as product_image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
        ORDER BY oi.created_at
      `
      return await this.all(query, [orderId])
    }
    
    async getOrders(filters = {}) {
      const { clause: whereClause, params: whereParams } = this.buildWhereClause({
        'o.customer_id': filters.customer_id,
        'o.cashier_id': filters.cashier_id,
        'o.payment_method': filters.payment_method,
        'o.order_status': filters.order_status,
        'o.order_number': filters.search ? `%${filters.search}%` : undefined
      })
      
      const { clause: paginationClause, params: paginationParams } = this.buildPagination(
        filters.page,
        filters.limit
      )
      
      let dateCondition = ''
      if (filters.date_from && filters.date_to) {
        dateCondition = whereClause 
          ? ` AND DATE(o.created_at) BETWEEN ? AND ?`
          : ` WHERE DATE(o.created_at) BETWEEN ? AND ?`
        whereParams.push(filters.date_from, filters.date_to)
      }
      
      const query = `
        SELECT 
          o.*,
          c.name as customer_name,
          c.phone as customer_phone,
          u.name as cashier_name,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users u ON o.cashier_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        ${whereClause}${dateCondition}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        ${paginationClause}
      `
      
      return await this.all(query, [...whereParams, ...paginationParams])
    }
    
    // ==========================================
    // CUSTOMER OPERATIONS
    // ==========================================
    
    async createCustomer(customerData) {
      const query = `
        INSERT INTO customers (
          id, name, email, phone, address, city, postal_code,
          date_of_birth, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `
      return await this.execute(query, [
        customerData.id,
        customerData.name,
        customerData.email || null,
        customerData.phone || null,
        customerData.address || null,
        customerData.city || null,
        customerData.postal_code || null,
        customerData.date_of_birth || null
      ])
    }
    
    async getCustomerById(customerId) {
      const query = `
        SELECT * FROM customers WHERE id = ? AND is_active = 1
      `
      return await this.first(query, [customerId])
    }
    
    async getCustomers(filters = {}) {
      const { clause: whereClause, params: whereParams } = this.buildWhereClause({
        'is_active': 1,
        'name': filters.search ? `%${filters.search}%` : undefined,
        'email': filters.email,
        'phone': filters.phone
      })
      
      const { clause: paginationClause, params: paginationParams } = this.buildPagination(
        filters.page,
        filters.limit
      )
      
      const query = `
        SELECT * FROM customers
        ${whereClause}
        ORDER BY name ASC
        ${paginationClause}
      `
      
      return await this.all(query, [...whereParams, ...paginationParams])
    }
    
    async updateCustomerStats(customerId, orderTotal, loyaltyPoints) {
      const query = `
        UPDATE customers 
        SET 
          total_spent = total_spent + ?,
          visit_count = visit_count + 1,
          loyalty_points = loyalty_points + ?,
          last_visit = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `
      return await this.execute(query, [orderTotal, loyaltyPoints, customerId])
    }
    
    // ==========================================
    // STAFF OPERATIONS
    // ==========================================
    
    async getStaffStats(userId) {
      const query = `
        SELECT * FROM staff_stats WHERE user_id = ?
      `
      return await this.first(query, [userId])
    }
    
    async updateStaffStats(userId, orderTotal, pointsEarned) {
      const query = `
        INSERT INTO staff_stats (user_id, total_sales, total_orders, total_points, created_at, updated_at)
        VALUES (?, ?, 1, ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          total_sales = total_sales + ?,
          total_orders = total_orders + 1,
          total_points = total_points + ?,
          last_sale = datetime('now'),
          updated_at = datetime('now')
      `
      return await this.execute(query, [userId, orderTotal, pointsEarned, orderTotal, pointsEarned])
    }
    
    async getStaffLeaderboard(period = 'month') {
      let dateCondition = ''
      switch (period) {
        case 'today':
          dateCondition = `AND DATE(s.last_sale) = DATE('now')`
          break
        case 'week':
          dateCondition = `AND s.last_sale >= DATE('now', '-7 days')`
          break
        case 'month':
          dateCondition = `AND s.last_sale >= DATE('now', '-30 days')`
          break
      }
      
      const query = `
        SELECT 
          u.id, u.name, u.avatar_url,
          s.total_sales, s.total_orders, s.total_points, 
          s.current_streak, s.commission_earned
        FROM staff_stats s
        JOIN users u ON s.user_id = u.id
        WHERE u.is_active = 1 ${dateCondition}
        ORDER BY s.total_sales DESC
        LIMIT 10
      `
      return await this.all(query)
    }
    
    // ==========================================
    // INVENTORY OPERATIONS
    // ==========================================
    
    async logInventoryChange(logData) {
      const query = `
        INSERT INTO inventory_logs (
          product_id, user_id, type, quantity_change, 
          previous_quantity, new_quantity, reason, reference_id, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      return await this.execute(query, [
        logData.product_id,
        logData.user_id,
        logData.type,
        logData.quantity_change,
        logData.previous_quantity,
        logData.new_quantity,
        logData.reason || null,
        logData.reference_id || null
      ])
    }
    
    async getInventoryLogs(filters = {}) {
      const { clause: whereClause, params: whereParams } = this.buildWhereClause({
        'il.product_id': filters.product_id,
        'il.user_id': filters.user_id,
        'il.type': filters.type
      })
      
      const { clause: paginationClause, params: paginationParams } = this.buildPagination(
        filters.page,
        filters.limit
      )
      
      const query = `
        SELECT 
          il.*,
          p.name as product_name,
          p.sku as product_sku,
          u.name as user_name
        FROM inventory_logs il
        LEFT JOIN products p ON il.product_id = p.id
        LEFT JOIN users u ON il.user_id = u.id
        ${whereClause}
        ORDER BY il.created_at DESC
        ${paginationClause}
      `
      
      return await this.all(query, [...whereParams, ...paginationParams])
    }
    
    // ==========================================
    // ANALYTICS OPERATIONS
    // ==========================================
    
    async getSalesStats(period = 'today', userId = null) {
      let dateCondition = ''
      let userCondition = userId ? 'AND o.cashier_id = ?' : ''
      let params = []
      
      switch (period) {
        case 'today':
          dateCondition = `WHERE DATE(o.created_at) = DATE('now')`
          break
        case 'week':
          dateCondition = `WHERE o.created_at >= DATE('now', '-7 days')`
          break
        case 'month':
          dateCondition = `WHERE o.created_at >= DATE('now', '-30 days')`
          break
        case 'year':
          dateCondition = `WHERE o.created_at >= DATE('now', '-365 days')`
          break
      }
      
      if (userId) {
        params.push(userId)
      }
      
      const query = `
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(AVG(o.total_amount), 0) as avg_order_value,
          COUNT(DISTINCT o.customer_id) as unique_customers,
          SUM(CASE WHEN o.payment_method = 'cash' THEN 1 ELSE 0 END) as cash_orders,
          SUM(CASE WHEN o.payment_method = 'card' THEN 1 ELSE 0 END) as card_orders,
          SUM(CASE WHEN o.payment_method = 'digital_wallet' THEN 1 ELSE 0 END) as digital_orders
        FROM orders o
        ${dateCondition} ${userCondition}
          AND o.order_status = 'completed'
      `
      
      return await this.first(query, params)
    }
    
    async getTopProducts(period = 'month', limit = 10) {
      let dateCondition = ''
      switch (period) {
        case 'today':
          dateCondition = `WHERE DATE(o.created_at) = DATE('now')`
          break
        case 'week':
          dateCondition = `WHERE o.created_at >= DATE('now', '-7 days')`
          break
        case 'month':
          dateCondition = `WHERE o.created_at >= DATE('now', '-30 days')`
          break
      }
      
      const query = `
        SELECT 
          p.id, p.name, p.sku, p.price,
          SUM(oi.quantity) as total_sold,
          SUM(oi.subtotal) as total_revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        ${dateCondition}
          AND o.order_status = 'completed'
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT ?
      `
      
      return await this.all(query, [limit])
    }
    
    // ==========================================
    // SETTINGS OPERATIONS
    // ==========================================
    
    async getSetting(key) {
      const query = `SELECT value, type FROM settings WHERE key = ?`
      const result = await this.first(query, [key])
      
      if (!result) return null
      
      // Parse value based on type
      switch (result.type) {
        case 'boolean':
          return result.value === 'true'
        case 'number':
          return parseFloat(result.value)
        case 'json':
          return JSON.parse(result.value)
        default:
          return result.value
      }
    }
    
    async setSetting(key, value, type = 'string') {
      const stringValue = type === 'json' ? JSON.stringify(value) : String(value)
      
      const query = `
        INSERT INTO settings (key, value, type, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = ?, type = ?, updated_at = datetime('now')
      `
      
      return await this.execute(query, [key, stringValue, type, stringValue, type])
    }
    
    // ==========================================
    // ACTIVITY LOGGING
    // ==========================================
    
    async logActivity(logData) {
      const query = `
        INSERT INTO activity_logs (
          user_id, action, entity_type, entity_id, 
          old_values, new_values, ip_address, user_agent, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `
      
      return await this.execute(query, [
        logData.user_id || null,
        logData.action,
        logData.entity_type,
        logData.entity_id || null,
        logData.old_values ? JSON.stringify(logData.old_values) : null,
        logData.new_values ? JSON.stringify(logData.new_values) : null,
        logData.ip_address || null,
        logData.user_agent || null
      ])
    }
  }
  
  // Custom error class for database operations
  export class DatabaseError extends Error {
    constructor(message, code = 'DATABASE_ERROR') {
      super(message)
      this.name = 'DatabaseError'
      this.code = code
    }
  }
  
  // Export singleton instance creator
  export function createDatabaseService(env) {
    return DatabaseService.initialize(env)
  }