import { Hono } from 'hono'
import { z } from 'zod'

const customers = new Hono()

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  notes: z.string().max(500).optional()
})

const updateCustomerSchema = createCustomerSchema.partial()

const loyaltyActionSchema = z.object({
  action: z.enum(['add', 'redeem']),
  points: z.number().int().positive('Points must be positive'),
  reason: z.string().min(1, 'Reason is required').max(200)
})

// Helper functions
async function calculateCustomerTier(totalSpent) {
  if (totalSpent >= 10000) return 'platinum'
  if (totalSpent >= 5000) return 'gold'
  if (totalSpent >= 1000) return 'silver'
  return 'bronze'
}

async function generateCustomerCode(name) {
  const nameCode = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
  const timestamp = Date.now().toString().slice(-4)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `CUS-${nameCode}${timestamp}${random}`
}

async function logCustomerActivity(db, customerId, userId, action, details = {}) {
  try {
    await db.prepare(`
      INSERT INTO activity_logs (
        user_id, action, entity_type, entity_id, 
        new_values, created_at
      )
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      userId,
      action,
      'customer',
      customerId,
      JSON.stringify(details)
    ).run()
  } catch (error) {
    console.error('Failed to log customer activity:', error)
  }
}

// ==========================================
// GET ROUTES
// ==========================================

// GET /api/customers - List customers with filters and pagination
customers.get('/', async (c) => {
  try {
    const user = c.get('user')
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      tier = '',
      city = '',
      sort_by = 'name',
      sort_order = 'asc',
      active_only = 'true'
    } = c.req.query()
    
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const validSortColumns = ['name', 'email', 'total_spent', 'visit_count', 'last_visit', 'created_at']
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name'
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    
    // Build WHERE clause
    let whereConditions = []
    let params = []
    
    if (search) {
      whereConditions.push(`(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`)
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    if (city) {
      whereConditions.push(`c.city = ?`)
      params.push(city)
    }
    
    if (active_only === 'true') {
      whereConditions.push(`c.is_active = 1`)
    }
    
    // Calculate tier on the fly
    if (tier) {
      const tierConditions = {
        bronze: 'c.total_spent < 1000',
        silver: 'c.total_spent >= 1000 AND c.total_spent < 5000',
        gold: 'c.total_spent >= 5000 AND c.total_spent < 10000',
        platinum: 'c.total_spent >= 10000'
      }
      
      if (tierConditions[tier]) {
        whereConditions.push(`(${tierConditions[tier]})`)
      }
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customers c
      ${whereClause}
    `
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first()
    const total = countResult.total
    
    // Get customers with calculated fields
    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN c.total_spent >= 10000 THEN 'platinum'
          WHEN c.total_spent >= 5000 THEN 'gold'
          WHEN c.total_spent >= 1000 THEN 'silver'
          ELSE 'bronze'
        END as tier,
        CASE 
          WHEN c.last_visit >= datetime('now', '-30 days') THEN 'active'
          WHEN c.last_visit >= datetime('now', '-90 days') THEN 'inactive'
          ELSE 'dormant'
        END as activity_status,
        (
          SELECT COUNT(*) 
          FROM orders o 
          WHERE o.customer_id = c.id AND o.order_status = 'completed'
        ) as total_orders
      FROM customers c
      ${whereClause}
      ORDER BY c.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    
    const customersResult = await c.env.DB.prepare(query).bind(
      ...params, 
      parseInt(limit), 
      offset
    ).all()
    
    return c.json({
      success: true,
      data: customersResult.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
    
  } catch (error) {
    console.error('Get customers error:', error)
    return c.json({
      error: 'Failed to fetch customers',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// GET /api/customers/:id - Get single customer with order history
customers.get('/:id', async (c) => {
  try {
    const customerId = c.req.param('id')
    
    // Get customer details
    const customer = await c.env.DB.prepare(`
      SELECT 
        c.*,
        CASE 
          WHEN c.total_spent >= 10000 THEN 'platinum'
          WHEN c.total_spent >= 5000 THEN 'gold'
          WHEN c.total_spent >= 1000 THEN 'silver'
          ELSE 'bronze'
        END as tier,
        CASE 
          WHEN c.last_visit >= datetime('now', '-30 days') THEN 'active'
          WHEN c.last_visit >= datetime('now', '-90 days') THEN 'inactive'
          ELSE 'dormant'
        END as activity_status
      FROM customers c
      WHERE c.id = ? AND c.is_active = 1
    `).bind(customerId).first()
    
    if (!customer) {
      return c.json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      }, 404)
    }
    
    // Get customer statistics
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(AVG(total_amount), 0) as avg_order_value,
        COALESCE(MAX(total_amount), 0) as highest_order,
        COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as orders_last_30_days,
        COUNT(CASE WHEN created_at >= datetime('now', '-365 days') THEN 1 END) as orders_this_year
      FROM orders 
      WHERE customer_id = ? AND order_status = 'completed'
    `).bind(customerId).first()
    
    // Get recent orders (last 10)
    const recentOrders = await c.env.DB.prepare(`
      SELECT 
        o.id, o.order_number, o.total_amount, o.payment_method,
        o.created_at, u.name as cashier_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.cashier_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ? AND o.order_status = 'completed'
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).bind(customerId).all()
    
    // Get favorite products (top 5 most purchased)
    const favoriteProducts = await c.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.image_url,
        SUM(oi.quantity) as total_quantity,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.subtotal) as total_spent
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.customer_id = ? AND o.order_status = 'completed'
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 5
    `).bind(customerId).all()
    
    return c.json({
      success: true,
      data: {
        ...customer,
        statistics: stats,
        recent_orders: recentOrders.results,
        favorite_products: favoriteProducts.results
      }
    })
    
  } catch (error) {
    console.error('Get customer error:', error)
    return c.json({
      error: 'Failed to fetch customer',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// GET /api/customers/stats/summary - Customer analytics summary
customers.get('/stats/summary', async (c) => {
  try {
    const user = c.get('user')
    
    // Overall customer statistics
    const overallStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_customers,
        COUNT(CASE WHEN last_visit >= datetime('now', '-30 days') THEN 1 END) as recent_visitors,
        COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_customers_30_days,
        COALESCE(AVG(total_spent), 0) as avg_customer_value,
        COALESCE(AVG(loyalty_points), 0) as avg_loyalty_points
      FROM customers
    `).first()
    
    // Customer tier distribution
    const tierDistribution = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'platinum'
          WHEN total_spent >= 5000 THEN 'gold'
          WHEN total_spent >= 1000 THEN 'silver'
          ELSE 'bronze'
        END as tier,
        COUNT(*) as count,
        ROUND(AVG(total_spent), 2) as avg_spent
      FROM customers 
      WHERE is_active = 1
      GROUP BY tier
      ORDER BY avg_spent DESC
    `).all()
    
    // Customer activity status
    const activityStats = await c.env.DB.prepare(`
      SELECT 
        CASE 
          WHEN last_visit >= datetime('now', '-30 days') THEN 'active'
          WHEN last_visit >= datetime('now', '-90 days') THEN 'inactive'
          ELSE 'dormant'
        END as status,
        COUNT(*) as count
      FROM customers 
      WHERE is_active = 1
      GROUP BY status
    `).all()
    
    // Top spending customers
    const topCustomers = await c.env.DB.prepare(`
      SELECT 
        id, name, email, total_spent, visit_count, loyalty_points,
        CASE 
          WHEN total_spent >= 10000 THEN 'platinum'
          WHEN total_spent >= 5000 THEN 'gold'
          WHEN total_spent >= 1000 THEN 'silver'
          ELSE 'bronze'
        END as tier
      FROM customers 
      WHERE is_active = 1 AND total_spent > 0
      ORDER BY total_spent DESC
      LIMIT 10
    `).all()
    
    return c.json({
      success: true,
      data: {
        overall: overallStats,
        tier_distribution: tierDistribution.results,
        activity_status: activityStats.results,
        top_customers: topCustomers.results
      }
    })
    
  } catch (error) {
    console.error('Get customer stats error:', error)
    return c.json({
      error: 'Failed to fetch customer statistics',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// ==========================================
// POST ROUTES
// ==========================================

// POST /api/customers - Create new customer
customers.post('/', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = createCustomerSchema.parse(body)
    
    // Check if customer already exists (by email or phone)
    if (validatedData.email) {
      const existingByEmail = await c.env.DB.prepare(`
        SELECT id FROM customers WHERE email = ? AND is_active = 1
      `).bind(validatedData.email).first()
      
      if (existingByEmail) {
        return c.json({
          error: 'Customer with this email already exists',
          code: 'EMAIL_EXISTS'
        }, 409)
      }
    }
    
    if (validatedData.phone) {
      const existingByPhone = await c.env.DB.prepare(`
        SELECT id FROM customers WHERE phone = ? AND is_active = 1
      `).bind(validatedData.phone).first()
      
      if (existingByPhone) {
        return c.json({
          error: 'Customer with this phone already exists',
          code: 'PHONE_EXISTS'
        }, 409)
      }
    }
    
    // Create customer
    const customerId = crypto.randomUUID()
    const customerCode = await generateCustomerCode(validatedData.name)
    
    await c.env.DB.prepare(`
      INSERT INTO customers (
        id, name, email, phone, address, city, postal_code,
        date_of_birth, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      customerId,
      validatedData.name,
      validatedData.email || null,
      validatedData.phone || null,
      validatedData.address || null,
      validatedData.city || null,
      validatedData.postal_code || null,
      validatedData.date_of_birth || null,
      validatedData.notes || null
    ).run()
    
    // Log customer creation
    await logCustomerActivity(c.env.DB, customerId, user.id, 'customer_created', {
      customer_name: validatedData.name,
      customer_code: customerCode
    })
    
    // Get created customer
    const newCustomer = await c.env.DB.prepare(`
      SELECT 
        c.*,
        'bronze' as tier,
        'new' as activity_status
      FROM customers c
      WHERE c.id = ?
    `).bind(customerId).first()
    
    return c.json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer
    }, 201)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Create customer error:', error)
    return c.json({
      error: 'Failed to create customer',
      code: 'CREATE_ERROR'
    }, 500)
  }
})

// POST /api/customers/:id/loyalty - Add/redeem loyalty points
customers.post('/:id/loyalty', async (c) => {
  try {
    const user = c.get('user')
    const customerId = c.req.param('id')
    const body = await c.req.json()
    const validatedData = loyaltyActionSchema.parse(body)
    
    // Get current customer
    const customer = await c.env.DB.prepare(`
      SELECT * FROM customers WHERE id = ? AND is_active = 1
    `).bind(customerId).first()
    
    if (!customer) {
      return c.json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      }, 404)
    }
    
    // Calculate new points
    let newPoints = customer.loyalty_points
    
    if (validatedData.action === 'add') {
      newPoints += validatedData.points
    } else if (validatedData.action === 'redeem') {
      if (customer.loyalty_points < validatedData.points) {
        return c.json({
          error: 'Insufficient loyalty points',
          code: 'INSUFFICIENT_POINTS'
        }, 400)
      }
      newPoints -= validatedData.points
    }
    
    // Update customer points
    await c.env.DB.prepare(`
      UPDATE customers 
      SET loyalty_points = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newPoints, customerId).run()
    
    // Log loyalty transaction
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (
        user_id, action, entity_type, entity_id, 
        new_values, created_at
      )
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user.id,
      `loyalty_${validatedData.action}`,
      'customer',
      customerId,
      JSON.stringify({
        points: validatedData.points,
        reason: validatedData.reason,
        previous_points: customer.loyalty_points,
        new_points: newPoints
      })
    ).run()
    
    return c.json({
      success: true,
      message: `Loyalty points ${validatedData.action}ed successfully`,
      data: {
        customer_id: customerId,
        action: validatedData.action,
        points: validatedData.points,
        previous_balance: customer.loyalty_points,
        new_balance: newPoints
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Loyalty points error:', error)
    return c.json({
      error: 'Failed to process loyalty points',
      code: 'LOYALTY_ERROR'
    }, 500)
  }
})

// ==========================================
// PUT ROUTES
// ==========================================

// PUT /api/customers/:id - Update customer
customers.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const customerId = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updateCustomerSchema.parse(body)
    
    // Check if customer exists
    const existingCustomer = await c.env.DB.prepare(`
      SELECT * FROM customers WHERE id = ? AND is_active = 1
    `).bind(customerId).first()
    
    if (!existingCustomer) {
      return c.json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      }, 404)
    }
    
    // Check email uniqueness (if being updated)
    if (validatedData.email && validatedData.email !== existingCustomer.email) {
      const emailExists = await c.env.DB.prepare(`
        SELECT id FROM customers WHERE email = ? AND id != ? AND is_active = 1
      `).bind(validatedData.email, customerId).first()
      
      if (emailExists) {
        return c.json({
          error: 'Email already exists',
          code: 'EMAIL_EXISTS'
        }, 409)
      }
    }
    
    // Check phone uniqueness (if being updated)
    if (validatedData.phone && validatedData.phone !== existingCustomer.phone) {
      const phoneExists = await c.env.DB.prepare(`
        SELECT id FROM customers WHERE phone = ? AND id != ? AND is_active = 1
      `).bind(validatedData.phone, customerId).first()
      
      if (phoneExists) {
        return c.json({
          error: 'Phone already exists',
          code: 'PHONE_EXISTS'
        }, 409)
      }
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
    params.push(customerId)
    
    await c.env.DB.prepare(`
      UPDATE customers 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()
    
    // Log customer update
    await logCustomerActivity(c.env.DB, customerId, user.id, 'customer_updated', {
      changes: validatedData
    })
    
    // Get updated customer
    const updatedCustomer = await c.env.DB.prepare(`
      SELECT 
        c.*,
        CASE 
          WHEN c.total_spent >= 10000 THEN 'platinum'
          WHEN c.total_spent >= 5000 THEN 'gold'
          WHEN c.total_spent >= 1000 THEN 'silver'
          ELSE 'bronze'
        END as tier
      FROM customers c
      WHERE c.id = ?
    `).bind(customerId).first()
    
    return c.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Update customer error:', error)
    return c.json({
      error: 'Failed to update customer',
      code: 'UPDATE_ERROR'
    }, 500)
  }
})

// ==========================================
// DELETE ROUTES (Admin only)
// ==========================================

// DELETE /api/customers/:id - Delete customer (soft delete)
customers.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const customerId = c.req.param('id')
    
    // Check permissions (Admin only)
    if (user.role !== 'admin') {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    // Check if customer exists
    const customer = await c.env.DB.prepare(`
      SELECT * FROM customers WHERE id = ? AND is_active = 1
    `).bind(customerId).first()
    
    if (!customer) {
      return c.json({
        error: 'Customer not found',
        code: 'CUSTOMER_NOT_FOUND'
      }, 404)
    }
    
    // Soft delete (set is_active = 0)
    await c.env.DB.prepare(`
      UPDATE customers 
      SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(customerId).run()
    
    // Log customer deletion
    await logCustomerActivity(c.env.DB, customerId, user.id, 'customer_deleted', {
      customer_name: customer.name
    })
    
    return c.json({
      success: true,
      message: 'Customer deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete customer error:', error)
    return c.json({
      error: 'Failed to delete customer',
      code: 'DELETE_ERROR'
    }, 500)
  }
})

export default customers