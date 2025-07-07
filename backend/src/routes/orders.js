import { Hono } from 'hono'
import { z } from 'zod'

const orders = new Hono()

// Validation schemas
const orderItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_price: z.number().positive('Unit price must be positive'),
  discount_amount: z.number().min(0).default(0)
})

const createOrderSchema = z.object({
  customer_id: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  payment_method: z.enum(['cash', 'card', 'digital_wallet', 'loyalty_points']),
  discount_amount: z.number().min(0).default(0),
  notes: z.string().optional()
})

const updateOrderSchema = z.object({
  order_status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  payment_status: z.enum(['pending', 'completed', 'refunded', 'cancelled']).optional(),
  notes: z.string().optional()
})

// Helper functions
async function generateOrderNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const timestamp = now.getTime().toString().slice(-6)
  
  return `ORD-${year}${month}${day}-${timestamp}`
}

async function updateProductStock(db, productId, quantityChange, userId, orderId) {
  const product = await db.prepare(`
    SELECT stock_quantity FROM products WHERE id = ?
  `).bind(productId).first()
  
  if (!product) {
    throw new Error(`Product ${productId} not found`)
  }
  
  const newQuantity = product.stock_quantity + quantityChange
  
  if (newQuantity < 0) {
    throw new Error(`Insufficient stock for product ${productId}`)
  }
  
  await db.prepare(`
    UPDATE products 
    SET stock_quantity = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(newQuantity, productId).run()
  
  // Log inventory change
  await db.prepare(`
    INSERT INTO inventory_logs (
      product_id, user_id, type, quantity_change, 
      previous_quantity, new_quantity, reason, reference_id, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    productId,
    userId,
    'sale',
    quantityChange,
    product.stock_quantity,
    newQuantity,
    'Product sale',
    orderId
  ).run()
}

async function updateStaffStats(db, userId, orderTotal, pointsEarned = 0) {
  try {
    // Update staff statistics
    await db.prepare(`
      INSERT INTO staff_stats (user_id, total_sales, total_orders, total_points, created_at, updated_at)
      VALUES (?, ?, 1, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        total_sales = total_sales + ?,
        total_orders = total_orders + 1,
        total_points = total_points + ?,
        last_sale = datetime('now'),
        updated_at = datetime('now')
    `).bind(userId, orderTotal, pointsEarned, orderTotal, pointsEarned).run()
    
    // Calculate commission (2% of order total)
    const commission = orderTotal * 0.02
    await db.prepare(`
      UPDATE staff_stats 
      SET commission_earned = commission_earned + ?
      WHERE user_id = ?
    `).bind(commission, userId).run()
    
  } catch (error) {
    console.error('Failed to update staff stats:', error)
  }
}

async function updateCustomerStats(db, customerId, orderTotal, pointsEarned = 0) {
  if (!customerId) return
  
  try {
    await db.prepare(`
      UPDATE customers 
      SET 
        total_spent = total_spent + ?,
        visit_count = visit_count + 1,
        loyalty_points = loyalty_points + ?,
        last_visit = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(orderTotal, pointsEarned, customerId).run()
  } catch (error) {
    console.error('Failed to update customer stats:', error)
  }
}

// ==========================================
// GET ROUTES
// ==========================================

// GET /api/orders - List orders with filters and pagination
orders.get('/', async (c) => {
  try {
    const user = c.get('user')
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      customer_id = '', 
      cashier_id = '',
      payment_method = '',
      order_status = '',
      payment_status = '',
      date_from = '',
      date_to = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = c.req.query()
    
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const validSortColumns = ['created_at', 'total_amount', 'order_number']
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at'
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    
    // Build WHERE clause
    let whereConditions = []
    let params = []
    
    if (search) {
      whereConditions.push(`o.order_number LIKE ?`)
      params.push(`%${search}%`)
    }
    
    if (customer_id) {
      whereConditions.push(`o.customer_id = ?`)
      params.push(customer_id)
    }
    
    if (cashier_id) {
      whereConditions.push(`o.cashier_id = ?`)
      params.push(cashier_id)
    }
    
    if (payment_method) {
      whereConditions.push(`o.payment_method = ?`)
      params.push(payment_method)
    }
    
    if (order_status) {
      whereConditions.push(`o.order_status = ?`)
      params.push(order_status)
    }
    
    if (payment_status) {
      whereConditions.push(`o.payment_status = ?`)
      params.push(payment_status)
    }
    
    if (date_from) {
      whereConditions.push(`DATE(o.created_at) >= ?`)
      params.push(date_from)
    }
    
    if (date_to) {
      whereConditions.push(`DATE(o.created_at) <= ?`)
      params.push(date_to)
    }
    
    // Non-admin users can only see their own orders (cashiers)
    if (user.role === 'cashier') {
      whereConditions.push(`o.cashier_id = ?`)
      params.push(user.id)
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first()
    const total = countResult.total
    
    // Get orders with related data
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
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    
    const ordersResult = await c.env.DB.prepare(query).bind(
      ...params, 
      parseInt(limit), 
      offset
    ).all()
    
    return c.json({
      success: true,
      data: ordersResult.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
    
  } catch (error) {
    console.error('Get orders error:', error)
    return c.json({
      error: 'Failed to fetch orders',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// GET /api/orders/:id - Get single order with items
orders.get('/:id', async (c) => {
  try {
    const user = c.get('user')
    const orderId = c.req.param('id')
    
    // Get order with related data
    const order = await c.env.DB.prepare(`
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
    `).bind(orderId).first()
    
    if (!order) {
      return c.json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, 404)
    }
    
    // Check permissions - cashiers can only see their own orders
    if (user.role === 'cashier' && order.cashier_id !== user.id) {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    // Get order items with product details
    const items = await c.env.DB.prepare(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku,
        p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at
    `).bind(orderId).all()
    
    return c.json({
      success: true,
      data: {
        ...order,
        items: items.results
      }
    })
    
  } catch (error) {
    console.error('Get order error:', error)
    return c.json({
      error: 'Failed to fetch order',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// GET /api/orders/stats/summary - Get order statistics
orders.get('/stats/summary', async (c) => {
  try {
    const user = c.get('user')
    const { period = 'today' } = c.req.query()
    
    let dateCondition = ''
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
    
    // Add user restriction for cashiers
    if (user.role === 'cashier') {
      dateCondition = dateCondition 
        ? `${dateCondition} AND o.cashier_id = ?`
        : `WHERE o.cashier_id = ?`
      params.push(user.id)
    }
    
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(AVG(o.total_amount), 0) as avg_order_value,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        SUM(CASE WHEN o.payment_method = 'cash' THEN 1 ELSE 0 END) as cash_orders,
        SUM(CASE WHEN o.payment_method = 'card' THEN 1 ELSE 0 END) as card_orders,
        SUM(CASE WHEN o.payment_method = 'digital_wallet' THEN 1 ELSE 0 END) as digital_orders
      FROM orders o
      ${dateCondition}
        AND o.order_status = 'completed'
    `).bind(...params).first()
    
    return c.json({
      success: true,
      data: stats,
      period
    })
    
  } catch (error) {
    console.error('Get order stats error:', error)
    return c.json({
      error: 'Failed to fetch order statistics',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// ==========================================
// POST ROUTES
// ==========================================

// POST /api/orders - Create new order (POS transaction)
orders.post('/', async (c) => {
  try {
    const user = c.get('user')
    
    // Check permissions - only cashiers and admins can create orders
    if (!['admin', 'cashier'].includes(user.role)) {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    const body = await c.req.json()
    const validatedData = createOrderSchema.parse(body)
    
    // Validate all products exist and calculate totals
    let subtotal = 0
    const validatedItems = []
    
    for (const item of validatedData.items) {
      const product = await c.env.DB.prepare(`
        SELECT id, name, price, stock_quantity, tax_rate 
        FROM products 
        WHERE id = ? AND is_active = 1
      `).bind(item.product_id).first()
      
      if (!product) {
        return c.json({
          error: `Product ${item.product_id} not found`,
          code: 'PRODUCT_NOT_FOUND'
        }, 404)
      }
      
      if (product.stock_quantity < item.quantity) {
        return c.json({
          error: `Insufficient stock for product ${product.name}`,
          code: 'INSUFFICIENT_STOCK'
        }, 400)
      }
      
      const itemSubtotal = (item.unit_price * item.quantity) - item.discount_amount
      subtotal += itemSubtotal
      
      validatedItems.push({
        ...item,
        product_name: product.name,
        tax_rate: product.tax_rate,
        subtotal: itemSubtotal
      })
    }
    
    // Calculate tax and total
    const totalTax = validatedItems.reduce((sum, item) => {
      return sum + (item.subtotal * item.tax_rate / 100)
    }, 0)
    
    const totalAmount = subtotal + totalTax - validatedData.discount_amount
    
    if (totalAmount <= 0) {
      return c.json({
        error: 'Order total must be positive',
        code: 'INVALID_TOTAL'
      }, 400)
    }
    
    // Create order
    const orderId = crypto.randomUUID()
    const orderNumber = await generateOrderNumber()
    
    // Start transaction (simulate with try-catch)
    try {
      // Insert order
      await c.env.DB.prepare(`
        INSERT INTO orders (
          id, order_number, customer_id, cashier_id, subtotal, tax_amount,
          discount_amount, total_amount, payment_method, payment_status,
          order_status, notes, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        orderId,
        orderNumber,
        validatedData.customer_id || null,
        user.id,
        subtotal,
        totalTax,
        validatedData.discount_amount,
        totalAmount,
        validatedData.payment_method,
        'completed',
        'completed',
        validatedData.notes || null
      ).run()
      
      // Insert order items and update stock
      for (const item of validatedItems) {
        const itemId = crypto.randomUUID()
        
        await c.env.DB.prepare(`
          INSERT INTO order_items (
            id, order_id, product_id, quantity, unit_price, 
            subtotal, discount_amount, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          itemId,
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.discount_amount
        ).run()
        
        // Update product stock
        await updateProductStock(
          c.env.DB, 
          item.product_id, 
          -item.quantity, 
          user.id, 
          orderId
        )
      }
      
      // Update staff statistics
      const pointsEarned = Math.floor(totalAmount / 10) // 1 point per $10
      await updateStaffStats(c.env.DB, user.id, totalAmount, pointsEarned)
      
      // Update customer statistics
      if (validatedData.customer_id) {
        const loyaltyPoints = Math.floor(totalAmount / 5) // 1 point per $5
        await updateCustomerStats(c.env.DB, validatedData.customer_id, totalAmount, loyaltyPoints)
      }
      
      // Get complete order data
      const newOrder = await c.env.DB.prepare(`
        SELECT 
          o.*,
          c.name as customer_name,
          u.name as cashier_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users u ON o.cashier_id = u.id
        WHERE o.id = ?
      `).bind(orderId).first()
      
      // Get order items
      const orderItems = await c.env.DB.prepare(`
        SELECT 
          oi.*,
          p.name as product_name,
          p.sku as product_sku
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).bind(orderId).all()
      
      return c.json({
        success: true,
        message: 'Order created successfully',
        data: {
          ...newOrder,
          items: orderItems.results
        }
      }, 201)
      
    } catch (error) {
      console.error('Order creation transaction error:', error)
      throw error
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Create order error:', error)
    return c.json({
      error: 'Failed to create order',
      code: 'CREATE_ERROR'
    }, 500)
  }
})

// ==========================================
// PUT ROUTES
// ==========================================

// PUT /api/orders/:id - Update order status
orders.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const orderId = c.req.param('id')
    
    const body = await c.req.json()
    const validatedData = updateOrderSchema.parse(body)
    
    // Check if order exists
    const order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).bind(orderId).first()
    
    if (!order) {
      return c.json({
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      }, 404)
    }
    
    // Check permissions
    if (user.role === 'cashier' && order.cashier_id !== user.id) {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    // Build update query
    const updates = []
    const params = []
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`)
        params.push(value)
      }
    })
    
    if (updates.length === 0) {
      return c.json({
        error: 'No fields to update',
        code: 'NO_UPDATES'
      }, 400)
    }
    
    updates.push('updated_at = datetime(\'now\')')
    params.push(orderId)
    
    await c.env.DB.prepare(`
      UPDATE orders 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()
    
    // Get updated order
    const updatedOrder = await c.env.DB.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        u.name as cashier_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.cashier_id = u.id
      WHERE o.id = ?
    `).bind(orderId).first()
    
    return c.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Update order error:', error)
    return c.json({
      error: 'Failed to update order',
      code: 'UPDATE_ERROR'
    }, 500)
  }
})

export default orders