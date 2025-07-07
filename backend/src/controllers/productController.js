/**
 * ============================================================================
 * PRODUCT CONTROLLER
 * ============================================================================
 * Handles all product-related business logic and operations
 */

import { DatabaseService } from '../utils/database.js';
import { KVCacheService } from '../utils/kvStore.js';
import { R2StorageService } from '../utils/r2Storage.js';
import { generateSlug, generateSku } from '../utils/helpers.js';

export class ProductController {
  /**
   * Get all products with filtering, pagination, and search
   */
  async getProducts(c) {
    try {
      const db = new DatabaseService(c.env.DB);
      const cache = new KVCacheService(c.env);
      
      // Get query parameters
      const page = parseInt(c.req.query('page')) || 1;
      const limit = parseInt(c.req.query('limit')) || 20;
      const search = c.req.query('search') || '';
      const category = c.req.query('category') || '';
      const status = c.req.query('status') || 'all';
      const sort = c.req.query('sort') || 'name';
      const order = c.req.query('order') || 'asc';
      const featured = c.req.query('featured') === 'true';
      const lowStock = c.req.query('low_stock') === 'true';
      
      // Build cache key
      const cacheKey = `products:list:${page}:${limit}:${search}:${category}:${status}:${sort}:${order}:${featured}:${lowStock}`;
      
      // Try to get from cache first
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        return c.json(cachedResult);
      }
      
      // Build where conditions
      let whereConditions = ['p.deleted_at IS NULL'];
      let whereArgs = [];
      
      // Search filter
      if (search) {
        whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)');
        const searchTerm = `%${search}%`;
        whereArgs.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      // Category filter
      if (category) {
        whereConditions.push('p.category_id = ?');
        whereArgs.push(category);
      }
      
      // Status filter
      if (status === 'active') {
        whereConditions.push('p.is_active = TRUE');
      } else if (status === 'inactive') {
        whereConditions.push('p.is_active = FALSE');
      }
      
      // Featured filter
      if (featured) {
        whereConditions.push('p.is_featured = TRUE');
      }
      
      // Low stock filter
      if (lowStock) {
        whereConditions.push('p.stock_quantity <= p.min_stock_level');
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Build order clause
      const validSortFields = ['name', 'sku', 'selling_price', 'stock_quantity', 'created_at', 'total_sold'];
      const sortField = validSortFields.includes(sort) ? sort : 'name';
      const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      const orderClause = `p.${sortField} ${sortOrder}`;
      
      // Get paginated results
      const result = await db.paginate('products p', {
        select: `
          p.*, 
          c.name as category_name,
          c.color as category_color,
          (p.stock_quantity - p.reserved_quantity) as available_quantity,
          CASE 
            WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
            WHEN p.stock_quantity <= p.min_stock_level THEN 'low_stock'
            ELSE 'in_stock'
          END as stock_status
        `,
        page,
        pageSize: limit,
        where: whereClause,
        whereArgs,
        orderBy: orderClause,
        joins: ['LEFT JOIN categories c ON p.category_id = c.id']
      });
      
      // Format products
      const formattedProducts = result.data.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        sellingPrice: parseFloat(product.selling_price),
        costPrice: parseFloat(product.cost_price || 0),
        stockQuantity: product.stock_quantity,
        availableQuantity: product.available_quantity,
        minStockLevel: product.min_stock_level,
        stockStatus: product.stock_status,
        isActive: product.is_active,
        isFeatured: product.is_featured,
        imageUrl: product.image_url,
        weight: product.weight,
        totalSold: product.total_sold || 0,
        totalRevenue: parseFloat(product.total_revenue || 0),
        lastSoldDate: product.last_sold_date,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        category: {
          id: product.category_id,
          name: product.category_name,
          color: product.category_color
        }
      }));
      
      const response = {
        success: true,
        data: formattedProducts,
        pagination: result.pagination,
        filters: {
          search,
          category,
          status,
          featured,
          lowStock
        },
        sorting: {
          field: sortField,
          order: sortOrder
        }
      };
      
      // Cache the result for 5 minutes
      await cache.set(cacheKey, response, 300);
      
      return c.json(response);
      
    } catch (error) {
      console.error('Get products error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'Failed to fetch products'
      }, 500);
    }
  }

  /**
   * Get single product by ID
   */
  async getProductById(c) {
    try {
      const productId = c.req.param('id');
      const db = new DatabaseService(c.env.DB);
      const cache = new KVCacheService(c.env);
      
      // Try cache first
      const cacheKey = `product:${productId}`;
      const cachedProduct = await cache.get(cacheKey);
      if (cachedProduct) {
        return c.json({
          success: true,
          data: cachedProduct
        });
      }
      
      // Get product from database
      const product = await db.first({
        sql: `
          SELECT p.*, 
                 c.name as category_name,
                 c.color as category_color,
                 s.name as supplier_name,
                 (p.stock_quantity - p.reserved_quantity) as available_quantity,
                 CASE 
                   WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
                   WHEN p.stock_quantity <= p.min_stock_level THEN 'low_stock'
                   ELSE 'in_stock'
                 END as stock_status
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE p.id = ? AND p.deleted_at IS NULL
        `,
        args: [productId]
      });
      
      if (!product) {
        return c.json({
          error: 'Product not found',
          message: 'Product with the specified ID does not exist'
        }, 404);
      }
      
      // Parse JSON fields
      let galleryImages = [];
      let tags = [];
      let variantOptions = [];
      
      try {
        galleryImages = product.gallery_images ? JSON.parse(product.gallery_images) : [];
        tags = product.tags ? JSON.parse(product.tags) : [];
        variantOptions = product.variant_options ? JSON.parse(product.variant_options) : [];
      } catch (parseError) {
        console.error('Error parsing product JSON fields:', parseError);
      }
      
      // Format product data
      const formattedProduct = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.short_description,
        sku: product.sku,
        barcode: product.barcode,
        qrCode: product.qr_code,
        
        // Pricing
        sellingPrice: parseFloat(product.selling_price),
        costPrice: parseFloat(product.cost_price || 0),
        markupPercentage: parseFloat(product.markup_percentage || 0),
        discountPrice: parseFloat(product.discount_price || 0),
        discountPercentage: parseFloat(product.discount_percentage || 0),
        wholesalePrice: parseFloat(product.wholesale_price || 0),
        retailPrice: parseFloat(product.retail_price || 0),
        
        // Tax
        taxRate: parseFloat(product.tax_rate || 0),
        taxInclusive: product.tax_inclusive,
        taxCategory: product.tax_category,
        
        // Inventory
        stockQuantity: product.stock_quantity,
        reservedQuantity: product.reserved_quantity,
        availableQuantity: product.available_quantity,
        minStockLevel: product.min_stock_level,
        maxStockLevel: product.max_stock_level,
        reorderLevel: product.reorder_level,
        reorderQuantity: product.reorder_quantity,
        stockStatus: product.stock_status,
        
        // Physical properties
        weight: product.weight,
        weightUnit: product.weight_unit,
        length: product.length,
        width: product.width,
        height: product.height,
        dimensionUnit: product.dimension_unit,
        volume: product.volume,
        volumeUnit: product.volume_unit,
        
        // Status flags
        isActive: product.is_active,
        isFeatured: product.is_featured,
        isDigital: product.is_digital,
        isTrackable: product.is_trackable,
        isReturnable: product.is_returnable,
        isAgeRestricted: product.is_age_restricted,
        minAgeRequired: product.min_age_required,
        
        // Media
        imageUrl: product.image_url,
        galleryImages,
        videoUrl: product.video_url,
        
        // SEO & Marketing
        metaTitle: product.meta_title,
        metaDescription: product.meta_description,
        metaKeywords: product.meta_keywords,
        tags,
        
        // Variants
        hasVariants: product.has_variants,
        variantType: product.variant_type,
        parentProductId: product.parent_product_id,
        variantOptions,
        
        // Sales data
        totalSold: product.total_sold || 0,
        totalRevenue: parseFloat(product.total_revenue || 0),
        lastSoldDate: product.last_sold_date,
        viewCount: product.view_count || 0,
        lastViewed: product.last_viewed,
        
        // Commission & Rewards
        commissionRate: parseFloat(product.commission_rate || 0),
        commissionAmount: parseFloat(product.commission_amount || 0),
        rewardPoints: product.reward_points || 0,
        loyaltyMultiplier: parseFloat(product.loyalty_multiplier || 1),
        
        // Dates
        launchDate: product.launch_date,
        discontinueDate: product.discontinue_date,
        expiryDate: product.expiry_date,
        
        // Category and supplier
        category: {
          id: product.category_id,
          name: product.category_name,
          color: product.category_color
        },
        supplier: {
          id: product.supplier_id,
          name: product.supplier_name
        },
        
        // Brand
        brand: product.brand,
        manufacturer: product.manufacturer,
        model: product.model,
        
        // Audit
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        createdBy: product.created_by,
        updatedBy: product.updated_by
      };
      
      // Update view count
      this.updateProductViewCount(db, productId).catch(console.error);
      
      // Cache the product for 10 minutes
      await cache.set(cacheKey, formattedProduct, 600);
      
      return c.json({
        success: true,
        data: formattedProduct
      });
      
    } catch (error) {
      console.error('Get product by ID error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'Failed to fetch product'
      }, 500);
    }
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(c) {
    try {
      const sku = c.req.param('sku');
      const db = new DatabaseService(c.env.DB);
      
      const product = await db.first({
        sql: `
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.sku = ? AND p.deleted_at IS NULL
        `,
        args: [sku]
      });
      
      if (!product) {
        return c.json({
          error: 'Product not found',
          message: 'Product with the specified SKU does not exist'
        }, 404);
      }
      
      return c.json({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          sellingPrice: parseFloat(product.selling_price),
          stockQuantity: product.stock_quantity,
          availableQuantity: product.stock_quantity - (product.reserved_quantity || 0),
          isActive: product.is_active,
          imageUrl: product.image_url,
          category: {
            id: product.category_id,
            name: product.category_name
          }
        }
      });
      
    } catch (error) {
      console.error('Get product by SKU error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'Failed to fetch product'
      }, 500);
    }
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(c) {
    try {
      const barcode = c.req.param('barcode');
      const db = new DatabaseService(c.env.DB);
      
      const product = await db.first({
        sql: `
          SELECT p.*, c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.barcode = ? AND p.deleted_at IS NULL
        `,
        args: [barcode]
      });
      
      if (!product) {
        return c.json({
          error: 'Product not found',
          message: 'Product with the specified barcode does not exist'
        }, 404);
      }
      
      return c.json({
        success: true,
        data: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          sellingPrice: parseFloat(product.selling_price),
          stockQuantity: product.stock_quantity,
          availableQuantity: product.stock_quantity - (product.reserved_quantity || 0),
          isActive: product.is_active,
          imageUrl: product.image_url,
          taxRate: parseFloat(product.tax_rate || 0),
          category: {
            id: product.category_id,
            name: product.category_name
          }
        }
      });
      
    } catch (error) {
      console.error('Get product by barcode error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'Failed to fetch product'
      }, 500);
    }
  }

  /**
   * Create new product
   */
  async createProduct(c) {
    try {
      const user = c.get('user');
      const productData = await c.req.json();
      const db = new DatabaseService(c.env.DB);
      const cache = new KVCacheService(c.env);
      
      // Validate required fields
      const { name, category_id, selling_price, sku } = productData;
      
      if (!name || !category_id || !selling_price || !sku) {
        return c.json({
          error: 'Missing required fields',
          message: 'Name, category, selling price, and SKU are required'
        }, 400);
      }
      
      // Check if SKU already exists
      const existingSku = await db.exists('products', 'sku = ?', [sku]);
      if (existingSku) {
        return c.json({
          error: 'SKU already exists',
          message: 'A product with this SKU already exists'
        }, 409);
      }
      
      // Check if barcode already exists (if provided)
      if (productData.barcode) {
        const existingBarcode = await db.exists('products', 'barcode = ?', [productData.barcode]);
        if (existingBarcode) {
          return c.json({
            error: 'Barcode already exists',
            message: 'A product with this barcode already exists'
          }, 409);
        }
      }
      
      // Verify category exists
      const categoryExists = await db.exists('categories', 'id = ?', [category_id]);
      if (!categoryExists) {
        return c.json({
          error: 'Invalid category',
          message: 'The specified category does not exist'
        }, 400);
      }
      
      // Generate slug
      const slug = generateSlug(name);
      
      // Prepare product data
      const newProduct = {
        name,
        slug,
        description: productData.description || '',
        short_description: productData.short_description || '',
        sku,
        barcode: productData.barcode || null,
        category_id,
        brand: productData.brand || '',
        manufacturer: productData.manufacturer || '',
        model: productData.model || '',
        
        // Pricing
        cost_price: productData.cost_price || 0,
        selling_price,
        wholesale_price: productData.wholesale_price || 0,
        retail_price: productData.retail_price || selling_price,
        
        // Tax
        tax_rate: productData.tax_rate || 0,
        tax_inclusive: productData.tax_inclusive || false,
        tax_category: productData.tax_category || 'standard',
        
        // Inventory
        stock_quantity: productData.stock_quantity || 0,
        min_stock_level: productData.min_stock_level || 0,
        max_stock_level: productData.max_stock_level || 1000,
        reorder_level: productData.reorder_level || 10,
        reorder_quantity: productData.reorder_quantity || 50,
        
        // Physical properties
        weight: productData.weight || null,
        weight_unit: productData.weight_unit || 'kg',
        length: productData.length || null,
        width: productData.width || null,
        height: productData.height || null,
        dimension_unit: productData.dimension_unit || 'cm',
        
        // Status
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        is_featured: productData.is_featured || false,
        is_digital: productData.is_digital || false,
        is_trackable: productData.is_trackable !== undefined ? productData.is_trackable : true,
        is_returnable: productData.is_returnable !== undefined ? productData.is_returnable : true,
        
        // SEO
        meta_title: productData.meta_title || name,
        meta_description: productData.meta_description || '',
        meta_keywords: productData.meta_keywords || '',
        tags: JSON.stringify(productData.tags || []),
        
        // Commission
        commission_rate: productData.commission_rate || 0,
        reward_points: productData.reward_points || 0,
        
        // Dates
        launch_date: productData.launch_date || null,
        
        // Audit
        created_by: user.id
      };
      
      // Calculate markup percentage if cost price is provided
      if (newProduct.cost_price > 0) {
        newProduct.markup_percentage = ((selling_price - newProduct.cost_price) / newProduct.cost_price) * 100;
      }
      
      // Insert product
      const result = await db.insert('products', newProduct);
      
      if (!result.success) {
        return c.json({
          error: 'Failed to create product',
          message: 'An error occurred while creating the product'
        }, 500);
      }
      
      // Clear products cache
      await this.clearProductsCache(cache);
      
      // Get the created product
      const createdProduct = await this.getFormattedProduct(db, result.insertId);
      
      return c.json({
        success: true,
        message: 'Product created successfully',
        data: createdProduct
      }, 201);
      
    } catch (error) {
      console.error('Create product error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'Failed to create product'
      }, 500);
    }
  }

  /**
   * Search products
   */
  async searchProducts(c) {
    try {
      const query = c.req.param('query');
      const limit = parseInt(c.req.query('limit')) || 50;
      const db = new DatabaseService(c.env.DB);
      
      if (!query || query.length < 2) {
        return c.json({
          error: 'Invalid search query',
          message: 'Search query must be at least 2 characters long'
        }, 400);
      }
      
      // Use full-text search if available, otherwise use LIKE
      const products = await db.search('products', query, {
        columns: ['name', 'description', 'sku', 'barcode', 'brand'],
        limit
      });
      
      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        sellingPrice: parseFloat(product.selling_price),
        stockQuantity: product.stock_quantity,
        isActive: product.is_active,
        imageUrl: product.image_url,
        brand: product.brand
      }));
      
      return c.json({
        success: true,
        data: formattedProducts,
        query,
        total: formattedProducts.length
      });
      
    } catch (error) {
      console.error('Search products error:', error);
      return c.json({
        error: 'Internal server error',
        message: 'Failed to search products'
      }, 500);
    }
  }

  /**
   * Helper method to get formatted product
   */
  async getFormattedProduct(db, productId) {
    const product = await db.first({
      sql: `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
      args: [productId]
    });
    
    if (!product) return null;
    
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode,
      sellingPrice: parseFloat(product.selling_price),
      costPrice: parseFloat(product.cost_price || 0),
      stockQuantity: product.stock_quantity,
      isActive: product.is_active,
      isFeatured: product.is_featured,
      imageUrl: product.image_url,
      category: {
        id: product.category_id,
        name: product.category_name
      },
      createdAt: product.created_at,
      updatedAt: product.updated_at
    };
  }

  /**
   * Helper method to update product view count
   */
  async updateProductViewCount(db, productId) {
    try {
      await db.execute({
        sql: `
          UPDATE products 
          SET view_count = view_count + 1, 
              last_viewed = datetime('now')
          WHERE id = ?
        `,
        args: [productId]
      });
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  }

  /**
   * Helper method to clear products cache
   */
  async clearProductsCache(cache) {
    try {
      const cacheKeys = [
        'products:active',
        'products:featured',
        'products:low_stock',
        'products:top_selling'
      ];
      
      await Promise.all(cacheKeys.map(key => cache.delete(key)));
    } catch (error) {
      console.error('Error clearing products cache:', error);
    }
  }
}