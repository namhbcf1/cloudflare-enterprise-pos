import { Hono } from 'hono'
import { z } from 'zod'

const products = new Hono()

// Validation schemas
const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  category_id: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  cost_price: z.number().positive('Cost price must be positive').optional(),
  stock_quantity: z.number().int().min(0, 'Stock quantity cannot be negative').default(0),
  reorder_level: z.number().int().min(0).default(10),
  barcode: z.string().optional(),
  image_url: z.string().url().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(), // JSON string
  tax_rate: z.number().min(0).max(100).default(0)
})

const updateProductSchema = createProductSchema.partial()

const stockUpdateSchema = z.object({
  quantity_change: z.number().int(),
  type: z.enum(['sale', 'restock', 'adjustment', 'waste', 'return']),
  reason: z.string().optional(),
  reference_id: z.string().optional()
})

// Helper functions
async function logInventoryChange(db, productId, userId, data) {
  try {
    await db.prepare(`
      INSERT INTO inventory_logs (
        product_id, user_id, type, quantity_change, 
        previous_quantity, new_quantity, reason, reference_id, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      productId,
      userId,
      data.type,
      data.quantity_change,
      data.previous_quantity,
      data.new_quantity,
      data.reason || null,
      data.reference_id || null
    ).run()
  } catch (error) {
    console.error('Failed to log inventory change:', error)
  }
}

async function updateProductStock(db, productId, quantityChange, userId, logData) {
  const product = await db.prepare(`
    SELECT stock_quantity FROM products WHERE id = ?
  `).bind(productId).first()
  
  if (!product) {
    throw new Error('Product not found')
  }
  
  const newQuantity = product.stock_quantity + quantityChange
  
  if (newQuantity < 0) {
    throw new Error('Insufficient stock')
  }
  
  await db.prepare(`
    UPDATE products 
    SET stock_quantity = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(newQuantity, productId).run()
  
  // Log inventory change
  await logInventoryChange(db, productId, userId, {
    ...logData,
    quantity_change: quantityChange,
    previous_quantity: product.stock_quantity,
    new_quantity: newQuantity
  })
  
  return newQuantity
}

// ==========================================
// GET ROUTES
// ==========================================

// GET /api/products - List all products with filters and pagination
products.get('/', async (c) => {
  try {
    const user = c.get('user')
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      category_id = '', 
      is_active = '',
      low_stock = '',
      sort_by = 'name',
      sort_order = 'asc'
    } = c.req.query()
    
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const validSortColumns = ['name', 'price', 'stock_quantity', 'created_at', 'sku']
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name'
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    
    // Build WHERE clause
    let whereConditions = []
    let params = []
    
    if (search) {
      whereConditions.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`)
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }
    
    if (category_id) {
      whereConditions.push(`p.category_id = ?`)
      params.push(category_id)
    }
    
    if (is_active !== '') {
      whereConditions.push(`p.is_active = ?`)
      params.push(is_active === 'true' ? 1 : 0)
    }
    
    if (low_stock === 'true') {
      whereConditions.push(`p.stock_quantity <= p.reorder_level`)
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first()
    const total = countResult.total
    
    // Get products with category info
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color,
        CASE 
          WHEN p.stock_quantity <= p.reorder_level THEN 1 
          ELSE 0 
        END as is_low_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `
    
    const productsResult = await c.env.DB.prepare(query).bind(
      ...params, 
      parseInt(limit), 
      offset
    ).all()
    
    return c.json({
      success: true,
      data: productsResult.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
    
  } catch (error) {
    console.error('Get products error:', error)
    return c.json({
      error: 'Failed to fetch products',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// GET /api/products/:id - Get single product
products.get('/:id', async (c) => {
  try {
    const productId = c.req.param('id')
    
    const product = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color,
        CASE 
          WHEN p.stock_quantity <= p.reorder_level THEN 1 
          ELSE 0 
        END as is_low_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(productId).first()
    
    if (!product) {
      return c.json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: product
    })
    
  } catch (error) {
    console.error('Get product error:', error)
    return c.json({
      error: 'Failed to fetch product',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// GET /api/products/barcode/:barcode - Get product by barcode
products.get('/barcode/:barcode', async (c) => {
  try {
    const barcode = c.req.param('barcode')
    
    const product = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color,
        CASE 
          WHEN p.stock_quantity <= p.reorder_level THEN 1 
          ELSE 0 
        END as is_low_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ? AND p.is_active = 1
    `).bind(barcode).first()
    
    if (!product) {
      return c.json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, 404)
    }
    
    return c.json({
      success: true,
      data: product
    })
    
  } catch (error) {
    console.error('Get product by barcode error:', error)
    return c.json({
      error: 'Failed to fetch product',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// GET /api/products/low-stock - Get low stock products
products.get('/low-stock', async (c) => {
  try {
    const lowStockProducts = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity <= p.reorder_level 
        AND p.is_active = 1
      ORDER BY p.stock_quantity ASC
    `).all()
    
    return c.json({
      success: true,
      data: lowStockProducts.results,
      count: lowStockProducts.results.length
    })
    
  } catch (error) {
    console.error('Get low stock products error:', error)
    return c.json({
      error: 'Failed to fetch low stock products',
      code: 'FETCH_ERROR'
    }, 500)
  }
})

// ==========================================
// POST ROUTES (Admin/Staff only)
// ==========================================

// POST /api/products - Create new product
products.post('/', async (c) => {
  try {
    const user = c.get('user')
    
    // Check permissions (Admin/Staff only)
    if (!['admin', 'staff'].includes(user.role)) {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    const body = await c.req.json()
    const validatedData = createProductSchema.parse(body)
    
    // Check if SKU already exists
    const existingSku = await c.env.DB.prepare(`
      SELECT id FROM products WHERE sku = ?
    `).bind(validatedData.sku).first()
    
    if (existingSku) {
      return c.json({
        error: 'SKU already exists',
        code: 'SKU_EXISTS'
      }, 409)
    }
    
    // Check if barcode already exists (if provided)
    if (validatedData.barcode) {
      const existingBarcode = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ?
      `).bind(validatedData.barcode).first()
      
      if (existingBarcode) {
        return c.json({
          error: 'Barcode already exists',
          code: 'BARCODE_EXISTS'
        }, 409)
      }
    }
    
    // Create product
    const productId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT INTO products (
        id, sku, name, description, category_id, price, cost_price,
        stock_quantity, reorder_level, barcode, image_url, weight,
        dimensions, tax_rate, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      productId,
      validatedData.sku,
      validatedData.name,
      validatedData.description || null,
      validatedData.category_id || null,
      validatedData.price,
      validatedData.cost_price || null,
      validatedData.stock_quantity,
      validatedData.reorder_level,
      validatedData.barcode || null,
      validatedData.image_url || null,
      validatedData.weight || null,
      validatedData.dimensions || null,
      validatedData.tax_rate
    ).run()
    
    // Log initial stock if > 0
    if (validatedData.stock_quantity > 0) {
      await logInventoryChange(c.env.DB, productId, user.id, {
        type: 'restock',
        quantity_change: validatedData.stock_quantity,
        previous_quantity: 0,
        new_quantity: validatedData.stock_quantity,
        reason: 'Initial stock'
      })
    }
    
    // Get created product
    const newProduct = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(productId).first()
    
    return c.json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    }, 201)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Create product error:', error)
    return c.json({
      error: 'Failed to create product',
      code: 'CREATE_ERROR'
    }, 500)
  }
})

// ==========================================
// PUT ROUTES (Admin/Staff only)
// ==========================================

// PUT /api/products/:id - Update product
products.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const productId = c.req.param('id')
    
    // Check permissions
    if (!['admin', 'staff'].includes(user.role)) {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    const body = await c.req.json()
    const validatedData = updateProductSchema.parse(body)
    
    // Check if product exists
    const existingProduct = await c.env.DB.prepare(`
      SELECT * FROM products WHERE id = ?
    `).bind(productId).first()
    
    if (!existingProduct) {
      return c.json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, 404)
    }
    
    // Check SKU uniqueness (if being updated)
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await c.env.DB.prepare(`
        SELECT id FROM products WHERE sku = ? AND id != ?
      `).bind(validatedData.sku, productId).first()
      
      if (skuExists) {
        return c.json({
          error: 'SKU already exists',
          code: 'SKU_EXISTS'
        }, 409)
      }
    }
    
    // Check barcode uniqueness (if being updated)
    if (validatedData.barcode && validatedData.barcode !== existingProduct.barcode) {
      const barcodeExists = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ? AND id != ?
      `).bind(validatedData.barcode, productId).first()
      
      if (barcodeExists) {
        return c.json({
          error: 'Barcode already exists',
          code: 'BARCODE_EXISTS'
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
    params.push(productId)
    
    await c.env.DB.prepare(`
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run()
    
    // Get updated product
    const updatedProduct = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(productId).first()
    
    return c.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    console.error('Update product error:', error)
    return c.json({
      error: 'Failed to update product',
      code: 'UPDATE_ERROR'
    }, 500)
  }
})

// PUT /api/products/:id/stock - Update product stock
products.put('/:id/stock', async (c) => {
  try {
    const user = c.get('user')
    const productId = c.req.param('id')
    
    // Check permissions
    if (!['admin', 'staff'].includes(user.role)) {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    const body = await c.req.json()
    const validatedData = stockUpdateSchema.parse(body)
    
    // Update stock and log change
    const newQuantity = await updateProductStock(
      c.env.DB, 
      productId, 
      validatedData.quantity_change, 
      user.id,
      {
        type: validatedData.type,
        reason: validatedData.reason,
        reference_id: validatedData.reference_id
      }
    )
    
    // Get updated product
    const product = await c.env.DB.prepare(`
      SELECT * FROM products WHERE id = ?
    `).bind(productId).first()
    
    return c.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        product_id: productId,
        previous_quantity: newQuantity - validatedData.quantity_change,
        new_quantity: newQuantity,
        quantity_change: validatedData.quantity_change
      }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }
    
    if (error.message === 'Product not found') {
      return c.json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, 404)
    }
    
    if (error.message === 'Insufficient stock') {
      return c.json({
        error: 'Insufficient stock',
        code: 'INSUFFICIENT_STOCK'
      }, 400)
    }
    
    console.error('Update stock error:', error)
    return c.json({
      error: 'Failed to update stock',
      code: 'UPDATE_ERROR'
    }, 500)
  }
})

// ==========================================
// DELETE ROUTES (Admin only)
// ==========================================

// DELETE /api/products/:id - Delete product (soft delete)
products.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const productId = c.req.param('id')
    
    // Check permissions (Admin only)
    if (user.role !== 'admin') {
      return c.json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      }, 403)
    }
    
    // Check if product exists
    const product = await c.env.DB.prepare(`
      SELECT * FROM products WHERE id = ?
    `).bind(productId).first()
    
    if (!product) {
      return c.json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, 404)
    }
    
    // Soft delete (set is_active = 0)
    await c.env.DB.prepare(`
      UPDATE products 
      SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(productId).run()
    
    return c.json({
      success: true,
      message: 'Product deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete product error:', error)
    return c.json({
      error: 'Failed to delete product',
      code: 'DELETE_ERROR'
    }, 500)
  }
})

export default products