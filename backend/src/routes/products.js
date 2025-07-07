/**
 * ============================================================================
 * PRODUCTS ROUTES
 * ============================================================================
 * Handles product management, inventory, and catalog operations
 */

import { Hono } from 'hono';
import { ProductController } from '../controllers/productController.js';
import { rbacMiddleware } from '../middleware/rbac.js';
import { validationMiddleware } from '../middleware/validation.js';

const products = new Hono();
const productController = new ProductController();

/**
 * Product validation schemas
 */
const createProductSchema = {
  name: { type: 'string', required: true, minLength: 2, maxLength: 200 },
  description: { type: 'string', required: false, maxLength: 1000 },
  sku: { type: 'string', required: true, minLength: 3, maxLength: 50 },
  barcode: { type: 'string', required: false, maxLength: 50 },
  category_id: { type: 'number', required: true },
  selling_price: { type: 'number', required: true, min: 0 },
  cost_price: { type: 'number', required: false, min: 0 },
  stock_quantity: { type: 'number', required: false, min: 0 },
  min_stock_level: { type: 'number', required: false, min: 0 },
  max_stock_level: { type: 'number', required: false, min: 1 },
  weight: { type: 'number', required: false, min: 0 },
  is_active: { type: 'boolean', required: false },
  is_featured: { type: 'boolean', required: false },
  tags: { type: 'array', required: false }
};

const updateProductSchema = {
  name: { type: 'string', required: false, minLength: 2, maxLength: 200 },
  description: { type: 'string', required: false, maxLength: 1000 },
  sku: { type: 'string', required: false, minLength: 3, maxLength: 50 },
  barcode: { type: 'string', required: false, maxLength: 50 },
  category_id: { type: 'number', required: false },
  selling_price: { type: 'number', required: false, min: 0 },
  cost_price: { type: 'number', required: false, min: 0 },
  stock_quantity: { type: 'number', required: false, min: 0 },
  min_stock_level: { type: 'number', required: false, min: 0 },
  max_stock_level: { type: 'number', required: false, min: 1 },
  weight: { type: 'number', required: false, min: 0 },
  is_active: { type: 'boolean', required: false },
  is_featured: { type: 'boolean', required: false },
  tags: { type: 'array', required: false }
};

const bulkUpdateSchema = {
  product_ids: { type: 'array', required: true, minLength: 1 },
  updates: { type: 'object', required: true }
};

const stockAdjustmentSchema = {
  product_id: { type: 'number', required: true },
  adjustment_type: { type: 'string', required: true, enum: ['increase', 'decrease', 'set'] },
  quantity: { type: 'number', required: true, min: 0 },
  reason: { type: 'string', required: true, minLength: 5 },
  notes: { type: 'string', required: false }
};

/**
 * @route GET /
 * @desc Get all products with filtering, pagination, and search
 * @access Private (All roles)
 */
products.get('/', async (c) => {
  return await productController.getProducts(c);
});

/**
 * @route GET /:id
 * @desc Get single product by ID
 * @access Private (All roles)
 */
products.get('/:id', async (c) => {
  return await productController.getProductById(c);
});

/**
 * @route GET /sku/:sku
 * @desc Get product by SKU
 * @access Private (All roles)
 */
products.get('/sku/:sku', async (c) => {
  return await productController.getProductBySku(c);
});

/**
 * @route GET /barcode/:barcode
 * @desc Get product by barcode
 * @access Private (All roles)
 */
products.get('/barcode/:barcode', async (c) => {
  return await productController.getProductByBarcode(c);
});

/**
 * @route POST /
 * @desc Create new product
 * @access Private (Admin, Cashier)
 */
products.post('/', rbacMiddleware(['admin', 'cashier']), validationMiddleware(createProductSchema), async (c) => {
  return await productController.createProduct(c);
});

/**
 * @route PUT /:id
 * @desc Update product
 * @access Private (Admin, Cashier)
 */
products.put('/:id', rbacMiddleware(['admin', 'cashier']), validationMiddleware(updateProductSchema), async (c) => {
  return await productController.updateProduct(c);
});

/**
 * @route DELETE /:id
 * @desc Delete product (soft delete)
 * @access Private (Admin)
 */
products.delete('/:id', rbacMiddleware(['admin']), async (c) => {
  return await productController.deleteProduct(c);
});

/**
 * @route POST /bulk-update
 * @desc Bulk update products
 * @access Private (Admin)
 */
products.post('/bulk-update', rbacMiddleware(['admin']), validationMiddleware(bulkUpdateSchema), async (c) => {
  return await productController.bulkUpdateProducts(c);
});

/**
 * @route POST /bulk-delete
 * @desc Bulk delete products
 * @access Private (Admin)
 */
products.post('/bulk-delete', rbacMiddleware(['admin']), async (c) => {
  return await productController.bulkDeleteProducts(c);
});

/**
 * @route GET /search/:query
 * @desc Search products
 * @access Private (All roles)
 */
products.get('/search/:query', async (c) => {
  return await productController.searchProducts(c);
});

/**
 * @route GET /category/:categoryId
 * @desc Get products by category
 * @access Private (All roles)
 */
products.get('/category/:categoryId', async (c) => {
  return await productController.getProductsByCategory(c);
});

/**
 * @route GET /featured
 * @desc Get featured products
 * @access Private (All roles)
 */
products.get('/featured', async (c) => {
  return await productController.getFeaturedProducts(c);
});

/**
 * @route GET /low-stock
 * @desc Get low stock products
 * @access Private (Admin, Cashier)
 */
products.get('/low-stock', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.getLowStockProducts(c);
});

/**
 * @route GET /out-of-stock
 * @desc Get out of stock products
 * @access Private (Admin, Cashier)
 */
products.get('/out-of-stock', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.getOutOfStockProducts(c);
});

/**
 * @route GET /top-selling
 * @desc Get top selling products
 * @access Private (Admin, Cashier)
 */
products.get('/top-selling', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.getTopSellingProducts(c);
});

/**
 * @route POST /:id/duplicate
 * @desc Duplicate product
 * @access Private (Admin, Cashier)
 */
products.post('/:id/duplicate', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.duplicateProduct(c);
});

/**
 * @route PUT /:id/status
 * @desc Update product status (active/inactive)
 * @access Private (Admin, Cashier)
 */
products.put('/:id/status', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.updateProductStatus(c);
});

/**
 * @route POST /:id/stock-adjustment
 * @desc Adjust product stock
 * @access Private (Admin, Cashier)
 */
products.post('/:id/stock-adjustment', rbacMiddleware(['admin', 'cashier']), validationMiddleware(stockAdjustmentSchema), async (c) => {
  return await productController.adjustStock(c);
});

/**
 * @route GET /:id/stock-history
 * @desc Get product stock movement history
 * @access Private (Admin, Cashier)
 */
products.get('/:id/stock-history', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.getStockHistory(c);
});

/**
 * @route GET /:id/sales-history
 * @desc Get product sales history
 * @access Private (Admin, Cashier)
 */
products.get('/:id/sales-history', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.getSalesHistory(c);
});

/**
 * @route POST /:id/upload-image
 * @desc Upload product image
 * @access Private (Admin, Cashier)
 */
products.post('/:id/upload-image', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.uploadProductImage(c);
});

/**
 * @route DELETE /:id/image
 * @desc Delete product image
 * @access Private (Admin, Cashier)
 */
products.delete('/:id/image', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.deleteProductImage(c);
});

/**
 * @route GET /:id/recommendations
 * @desc Get AI-powered product recommendations
 * @access Private (All roles)
 */
products.get('/:id/recommendations', async (c) => {
  return await productController.getProductRecommendations(c);
});

/**
 * @route POST /:id/review
 * @desc Add product review/rating
 * @access Private (All roles)
 */
products.post('/:id/review', async (c) => {
  return await productController.addProductReview(c);
});

/**
 * @route GET /:id/reviews
 * @desc Get product reviews
 * @access Private (All roles)
 */
products.get('/:id/reviews', async (c) => {
  return await productController.getProductReviews(c);
});

/**
 * @route POST /import
 * @desc Import products from CSV/Excel
 * @access Private (Admin)
 */
products.post('/import', rbacMiddleware(['admin']), async (c) => {
  return await productController.importProducts(c);
});

/**
 * @route GET /export
 * @desc Export products to CSV/Excel
 * @access Private (Admin, Cashier)
 */
products.get('/export', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.exportProducts(c);
});

/**
 * @route POST /generate-barcode
 * @desc Generate barcode for product
 * @access Private (Admin, Cashier)
 */
products.post('/generate-barcode', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.generateBarcode(c);
});

/**
 * @route POST /print-labels
 * @desc Print product labels
 * @access Private (Admin, Cashier)
 */
products.post('/print-labels', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.printLabels(c);
});

/**
 * @route GET /analytics
 * @desc Get product analytics
 * @access Private (Admin, Cashier)
 */
products.get('/analytics', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.getProductAnalytics(c);
});

/**
 * @route POST /price-optimization
 * @desc Get AI-powered price optimization suggestions
 * @access Private (Admin)
 */
products.post('/price-optimization', rbacMiddleware(['admin']), async (c) => {
  return await productController.getPriceOptimization(c);
});

/**
 * @route GET /demand-forecast/:id
 * @desc Get demand forecast for product
 * @access Private (Admin)
 */
products.get('/demand-forecast/:id', rbacMiddleware(['admin']), async (c) => {
  return await productController.getDemandForecast(c);
});

/**
 * @route POST /:id/variants
 * @desc Create product variants
 * @access Private (Admin, Cashier)
 */
products.post('/:id/variants', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.createProductVariants(c);
});

/**
 * @route GET /:id/variants
 * @desc Get product variants
 * @access Private (All roles)
 */
products.get('/:id/variants', async (c) => {
  return await productController.getProductVariants(c);
});

/**
 * @route PUT /variants/:variantId
 * @desc Update product variant
 * @access Private (Admin, Cashier)
 */
products.put('/variants/:variantId', rbacMiddleware(['admin', 'cashier']), async (c) => {
  return await productController.updateProductVariant(c);
});

/**
 * @route DELETE /variants/:variantId
 * @desc Delete product variant
 * @access Private (Admin)
 */
products.delete('/variants/:variantId', rbacMiddleware(['admin']), async (c) => {
  return await productController.deleteProductVariant(c);
});

export default products;