// backend/src/routes/analytics.js
// Enterprise POS System - Analytics & Reporting
// Real-time business intelligence, dashboards, and comprehensive reporting

import { Hono } from 'hono';
import { auth } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';
import { DatabaseService } from '../services/database.js';

const analytics = new Hono();

// Real-time dashboard data
analytics.get('/dashboard', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { period = '30d' } = c.req.query();
    const db = new DatabaseService(c.env.DB);

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(now - 24*60*60*1000);
        break;
      case '7d':
        startDate = new Date(now - 7*24*60*60*1000);
        break;
      case '30d':
        startDate = new Date(now - 30*24*60*60*1000);
        break;
      case '90d':
        startDate = new Date(now - 90*24*60*60*1000);
        break;
      case '1y':
        startDate = new Date(now - 365*24*60*60*1000);
        break;
      default:
        startDate = new Date(now - 30*24*60*60*1000);
    }

    const dateFilter = startDate.toISOString();

    // Get key metrics
    const metricsStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(DISTINCT staff_id) as active_staff
      FROM orders 
      WHERE created_at >= ? AND status != 'cancelled'
    `);
    const { results: metrics } = await metricsStmt.bind(dateFilter).all();

    // Get revenue trend (daily)
    const trendStmt = c.env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT customer_id) as customers
      FROM orders 
      WHERE created_at >= ? AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    const { results: trend } = await trendStmt.bind(dateFilter).all();

    // Get top products
    const topProductsStmt = c.env.DB.prepare(`
      SELECT 
        p.name,
        p.sku,
        p.category_id,
        c.name as category_name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as revenue,
        AVG(p.price) as avg_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.created_at >= ? AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `);
    const { results: topProducts } = await topProductsStmt.bind(dateFilter).all();

    // Get payment method breakdown
    const paymentStmt = c.env.DB.prepare(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM orders 
      WHERE created_at >= ? AND status != 'cancelled'
      GROUP BY payment_method
    `);
    const { results: paymentBreakdown } = await paymentStmt.bind(dateFilter).all();

    // Get hourly sales pattern
    const hourlyStmt = c.env.DB.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders 
      WHERE created_at >= ? AND status != 'cancelled'
      GROUP BY hour
      ORDER BY hour
    `);
    const { results: hourlySales } = await hourlyStmt.bind(dateFilter).all();

    // Get top customers
    const topCustomersStmt = c.env.DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.loyalty_points,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as avg_order
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      WHERE o.created_at >= ? AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY total_spent DESC
      LIMIT 10
    `);
    const { results: topCustomers } = await topCustomersStmt.bind(dateFilter).all();

    // Get staff performance
    const staffPerformanceStmt = c.env.DB.prepare(`
      SELECT 
        s.id,
        u.name,
        s.role,
        COUNT(o.id) as orders,
        SUM(o.total_amount) as sales,
        AVG(o.total_amount) as avg_sale,
        st.current_level,
        st.experience_points
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN orders o ON s.id = o.staff_id AND o.created_at >= ?
      LEFT JOIN staff_stats st ON s.id = st.staff_id
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY sales DESC NULLS LAST
      LIMIT 10
    `);
    const { results: staffPerformance } = await staffPerformanceStmt.bind(dateFilter).all();

    // Get inventory alerts
    const inventoryAlertsStmt = c.env.DB.prepare(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.current_stock,
        p.low_stock_threshold,
        p.price,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.current_stock <= p.low_stock_threshold AND p.active = 1
      ORDER BY (p.current_stock - p.low_stock_threshold) ASC
      LIMIT 20
    `);
    const { results: inventoryAlerts } = await inventoryAlertsStmt.all();

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousMetricsStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue
      FROM orders 
      WHERE created_at >= ? AND created_at < ? AND status != 'cancelled'
    `);
    const { results: previousMetrics } = await previousMetricsStmt.bind(
      previousPeriodStart.toISOString(),
      dateFilter
    ).all();

    const current = metrics[0] || {};
    const previous = previousMetrics[0] || {};
    
    const revenueGrowth = previous.total_revenue > 0 
      ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue * 100).toFixed(1)
      : 0;
    
    const orderGrowth = previous.total_orders > 0
      ? ((current.total_orders - previous.total_orders) / previous.total_orders * 100).toFixed(1)
      : 0;

    return c.json({
      period,
      metrics: {
        ...current,
        revenue_growth: parseFloat(revenueGrowth),
        order_growth: parseFloat(orderGrowth)
      },
      trends: {
        daily: trend,
        hourly: hourlySales
      },
      topProducts,
      topCustomers,
      staffPerformance,
      paymentBreakdown,
      inventoryAlerts,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// Sales report with detailed breakdown
analytics.get('/sales', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      staffId,
      customerId,
      productId 
    } = c.req.query();

    let filters = [];
    let params = [];

    if (startDate) {
      filters.push('o.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      filters.push('o.created_at <= ?');
      params.push(endDate);
    }

    if (staffId) {
      filters.push('o.staff_id = ?');
      params.push(staffId);
    }

    if (customerId) {
      filters.push('o.customer_id = ?');
      params.push(customerId);
    }

    filters.push("o.status != 'cancelled'");

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // Group by clause
    let groupByClause = '';
    let selectGroup = '';
    
    switch (groupBy) {
      case 'hour':
        selectGroup = `strftime('%Y-%m-%d %H:00:00', o.created_at) as period`;
        groupByClause = `GROUP BY strftime('%Y-%m-%d %H', o.created_at)`;
        break;
      case 'day':
        selectGroup = `DATE(o.created_at) as period`;
        groupByClause = `GROUP BY DATE(o.created_at)`;
        break;
      case 'week':
        selectGroup = `strftime('%Y-W%W', o.created_at) as period`;
        groupByClause = `GROUP BY strftime('%Y-W%W', o.created_at)`;
        break;
      case 'month':
        selectGroup = `strftime('%Y-%m', o.created_at) as period`;
        groupByClause = `GROUP BY strftime('%Y-%m', o.created_at)`;
        break;
      case 'staff':
        selectGroup = `u.name as period, s.id as staff_id`;
        groupByClause = `GROUP BY s.id`;
        break;
    }

    const salesQuery = `
      SELECT 
        ${selectGroup},
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        SUM(o.tax_amount) as total_tax,
        SUM(o.discount_amount) as total_discount,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        MIN(o.total_amount) as min_order,
        MAX(o.total_amount) as max_order
      FROM orders o
      ${groupBy === 'staff' ? 'LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN users u ON s.user_id = u.id' : ''}
      ${whereClause}
      ${groupByClause}
      ORDER BY period ${groupBy === 'staff' ? '' : 'ASC'}
    `;

    const stmt = c.env.DB.prepare(salesQuery);
    const { results: salesData } = await stmt.bind(...params).all();

    // Get product breakdown if product filter is applied
    let productBreakdown = [];
    if (productId) {
      const productStmt = c.env.DB.prepare(`
        SELECT 
          p.name,
          p.sku,
          SUM(oi.quantity) as quantity_sold,
          SUM(oi.subtotal) as revenue,
          AVG(oi.unit_price) as avg_price
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        ${whereClause} ${productId ? (whereClause ? 'AND' : 'WHERE') + ' p.id = ?' : ''}
        GROUP BY p.id
        ORDER BY revenue DESC
      `);
      
      const productParams = [...params];
      if (productId) productParams.push(productId);
      
      const { results } = await productStmt.bind(...productParams).all();
      productBreakdown = results;
    }

    // Calculate totals
    const totals = salesData.reduce((acc, item) => ({
      total_orders: acc.total_orders + item.order_count,
      total_revenue: acc.total_revenue + item.total_revenue,
      total_tax: acc.total_tax + item.total_tax,
      total_discount: acc.total_discount + item.total_discount,
      unique_customers: Math.max(acc.unique_customers, item.unique_customers)
    }), { total_orders: 0, total_revenue: 0, total_tax: 0, total_discount: 0, unique_customers: 0 });

    return c.json({
      groupBy,
      filters: { startDate, endDate, staffId, customerId, productId },
      data: salesData,
      productBreakdown,
      totals: {
        ...totals,
        avg_order_value: totals.total_orders > 0 ? totals.total_revenue / totals.total_orders : 0
      }
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    return c.json({ error: 'Failed to generate sales report' }, 500);
  }
});

// Product performance report
analytics.get('/products', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { 
      startDate, 
      endDate, 
      categoryId, 
      sortBy = 'revenue',
      limit = 50 
    } = c.req.query();

    let filters = ['o.status != "cancelled"'];
    let params = [];

    if (startDate) {
      filters.push('o.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      filters.push('o.created_at <= ?');
      params.push(endDate);
    }

    if (categoryId) {
      filters.push('p.category_id = ?');
      params.push(categoryId);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    let orderBy = 'total_revenue DESC';
    switch (sortBy) {
      case 'quantity':
        orderBy = 'quantity_sold DESC';
        break;
      case 'profit':
        orderBy = 'total_profit DESC';
        break;
      case 'margin':
        orderBy = 'profit_margin DESC';
        break;
    }

    const productQuery = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.price,
        p.cost,
        p.current_stock,
        c.name as category_name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.unit_price) as avg_selling_price,
        COUNT(DISTINCT o.id) as order_frequency,
        COUNT(DISTINCT o.customer_id) as unique_buyers,
        SUM(oi.quantity * p.cost) as total_cost,
        SUM(oi.subtotal) - SUM(oi.quantity * p.cost) as total_profit,
        CASE 
          WHEN SUM(oi.subtotal) > 0 
          THEN ((SUM(oi.subtotal) - SUM(oi.quantity * p.cost)) / SUM(oi.subtotal)) * 100 
          ELSE 0 
        END as profit_margin,
        MIN(o.created_at) as first_sale,
        MAX(o.created_at) as last_sale
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY ${orderBy}
      LIMIT ?
    `;

    params.push(parseInt(limit));
    const stmt = c.env.DB.prepare(productQuery);
    const { results: products } = await stmt.bind(...params).all();

    // Get category summary
    const categoryQuery = `
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT p.id) as product_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_revenue,
        AVG(p.price) as avg_price
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      ${whereClause.replace('p.category_id = ?', 'c.id = ? OR ? IS NULL')}
      GROUP BY c.id
      ORDER BY total_revenue DESC
    `;

    // Modify params for category query
    const categoryParams = [...params];
    if (categoryId) {
      categoryParams[categoryParams.length - 2] = categoryId; // Replace the last categoryId
      categoryParams.splice(-1, 0, categoryId); // Add another categoryId for the OR condition
    } else {
      categoryParams.splice(-1, 0, null); // Add null for the OR condition
    }

    const categoryStmt = c.env.DB.prepare(categoryQuery);
    const { results: categories } = await categoryStmt.bind(...categoryParams).all();

    return c.json({
      filters: { startDate, endDate, categoryId, sortBy },
      products,
      categories,
      summary: {
        total_products: products.length,
        total_revenue: products.reduce((sum, p) => sum + (p.total_revenue || 0), 0),
        total_quantity: products.reduce((sum, p) => sum + (p.quantity_sold || 0), 0),
        avg_profit_margin: products.length > 0 
          ? products.reduce((sum, p) => sum + (p.profit_margin || 0), 0) / products.length 
          : 0
      }
    });

  } catch (error) {
    console.error('Error generating product report:', error);
    return c.json({ error: 'Failed to generate product report' }, 500);
  }
});

// Customer analytics
analytics.get('/customers', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { 
      startDate, 
      endDate, 
      segment = 'all',
      limit = 100 
    } = c.req.query();

    let filters = ['o.status != "cancelled"'];
    let params = [];

    if (startDate) {
      filters.push('o.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      filters.push('o.created_at <= ?');
      params.push(endDate);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    // Customer analysis query
    const customerQuery = `
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.loyalty_points,
        c.created_at as registration_date,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as avg_order_value,
        MIN(o.created_at) as first_order,
        MAX(o.created_at) as last_order,
        COUNT(DISTINCT DATE(o.created_at)) as shopping_days,
        CASE 
          WHEN COUNT(o.id) = 1 THEN 'New'
          WHEN COUNT(o.id) BETWEEN 2 AND 5 THEN 'Regular'
          WHEN COUNT(o.id) > 5 AND MAX(o.created_at) > datetime('now', '-30 days') THEN 'VIP'
          WHEN MAX(o.created_at) < datetime('now', '-90 days') THEN 'Inactive'
          ELSE 'Active'
        END as segment,
        julianday('now') - julianday(MAX(o.created_at)) as days_since_last_order
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      ${whereClause}
      GROUP BY c.id
      HAVING COUNT(o.id) > 0
      ORDER BY total_spent DESC
      LIMIT ?
    `;

    params.push(parseInt(limit));
    const stmt = c.env.DB.prepare(customerQuery);
    const { results: customers } = await stmt.bind(...params).all();

    // Filter by segment if specified
    let filteredCustomers = customers;
    if (segment !== 'all') {
      filteredCustomers = customers.filter(c => c.segment.toLowerCase() === segment.toLowerCase());
    }

    // Customer segmentation summary
    const segmentSummary = customers.reduce((acc, customer) => {
      const seg = customer.segment;
      if (!acc[seg]) {
        acc[seg] = { count: 0, totalSpent: 0, avgSpent: 0 };
      }
      acc[seg].count++;
      acc[seg].totalSpent += customer.total_spent;
      acc[seg].avgSpent = acc[seg].totalSpent / acc[seg].count;
      return acc;
    }, {});

    // RFM Analysis (Recency, Frequency, Monetary)
    const rfmQuery = `
      SELECT 
        c.id,
        c.name,
        julianday('now') - julianday(MAX(o.created_at)) as recency_days,
        COUNT(o.id) as frequency,
        SUM(o.total_amount) as monetary_value,
        NTILE(5) OVER (ORDER BY julianday('now') - julianday(MAX(o.created_at)) DESC) as recency_score,
        NTILE(5) OVER (ORDER BY COUNT(o.id)) as frequency_score,
        NTILE(5) OVER (ORDER BY SUM(o.total_amount)) as monetary_score
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      ${whereClause}
      GROUP BY c.id
      HAVING COUNT(o.id) > 0
    `;

    const rfmStmt = c.env.DB.prepare(rfmQuery);
    const { results: rfmData } = await rfmStmt.bind(...params.slice(0, -1)).all();

    // Customer lifecycle analysis
    const lifecycleQuery = `
      SELECT 
        strftime('%Y-%m', c.created_at) as cohort_month,
        COUNT(*) as customers_acquired,
        COUNT(CASE WHEN o.id IS NOT NULL THEN 1 END) as customers_with_orders,
        SUM(o.total_amount) as cohort_revenue,
        AVG(o.total_amount) as avg_customer_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id ${startDate || endDate ? `AND o.created_at >= '${startDate || '2020-01-01'}' AND o.created_at <= '${endDate || new Date().toISOString()}'` : ''}
      WHERE c.created_at >= '${startDate || '2020-01-01'}'
      GROUP BY strftime('%Y-%m', c.created_at)
      ORDER BY cohort_month DESC
      LIMIT 12
    `;

    const lifecycleStmt = c.env.DB.prepare(lifecycleQuery);
    const { results: lifecycleData } = await lifecycleStmt.all();

    return c.json({
      filters: { startDate, endDate, segment },
      customers: filteredCustomers,
      segmentSummary,
      rfmAnalysis: rfmData,
      lifecycleAnalysis: lifecycleData,
      summary: {
        total_customers: customers.length,
        total_revenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
        avg_customer_value: customers.length > 0 
          ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length 
          : 0,
        avg_orders_per_customer: customers.length > 0
          ? customers.reduce((sum, c) => sum + c.total_orders, 0) / customers.length
          : 0
      }
    });

  } catch (error) {
    console.error('Error generating customer report:', error);
    return c.json({ error: 'Failed to generate customer report' }, 500);
  }
});

// Staff performance report
analytics.get('/staff', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { 
      startDate, 
      endDate, 
      staffId, 
      department,
      metric = 'sales' 
    } = c.req.query();

    let filters = ['o.status != "cancelled"'];
    let params = [];

    if (startDate) {
      filters.push('o.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      filters.push('o.created_at <= ?');
      params.push(endDate);
    }

    if (staffId) {
      filters.push('s.id = ?');
      params.push(staffId);
    }

    if (department) {
      filters.push('s.department = ?');
      params.push(department);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const staffQuery = `
      SELECT 
        s.id,
        u.name,
        u.email,
        s.role,
        s.department,
        s.hire_date,
        s.hourly_rate,
        s.commission_rate,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_sales,
        AVG(o.total_amount) as avg_transaction,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        SUM(o.total_amount * s.commission_rate / 100) as total_commission,
        MIN(o.created_at) as first_sale_period,
        MAX(o.created_at) as last_sale_period,
        st.current_level,
        st.experience_points,
        st.badges_earned,
        st.achievements_count,
        st.customer_rating,
        COUNT(DISTINCT DATE(o.created_at)) as active_days
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN orders o ON s.id = o.staff_id
      LEFT JOIN staff_stats st ON s.id = st.staff_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY total_sales DESC NULLS LAST
    `;

    const stmt = c.env.DB.prepare(staffQuery);
    const { results: staffData } = await stmt.bind(...params).all();

    // Department summary
    const departmentQuery = `
      SELECT 
        s.department,
        COUNT(DISTINCT s.id) as staff_count,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_sales,
        AVG(o.total_amount) as avg_transaction,
        SUM(o.total_amount * s.commission_rate / 100) as total_commission
      FROM staff s
      LEFT JOIN orders o ON s.id = o.staff_id
      ${whereClause}
      GROUP BY s.department
      ORDER BY total_sales DESC NULLS LAST
    `;

    const deptStmt = c.env.DB.prepare(departmentQuery);
    const { results: departmentData } = await deptStmt.bind(...params).all();

    // Performance trends (daily)
    const trendsQuery = `
      SELECT 
        DATE(o.created_at) as date,
        s.id as staff_id,
        u.name as staff_name,
        COUNT(o.id) as daily_orders,
        SUM(o.total_amount) as daily_sales
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN orders o ON s.id = o.staff_id
      ${whereClause}
      GROUP BY DATE(o.created_at), s.id
      ORDER BY date ASC, daily_sales DESC
    `;

    const trendsStmt = c.env.DB.prepare(trendsQuery);
    const { results: trendsData } = await trendsStmt.bind(...params).all();

    return c.json({
      filters: { startDate, endDate, staffId, department, metric },
      staff: staffData,
      departments: departmentData,
      trends: trendsData,
      summary: {
        total_staff: staffData.length,
        total_sales: staffData.reduce((sum, s) => sum + (s.total_sales || 0), 0),
        total_orders: staffData.reduce((sum, s) => sum + (s.total_orders || 0), 0),
        total_commission: staffData.reduce((sum, s) => sum + (s.total_commission || 0), 0),
        avg_sales_per_staff: staffData.length > 0 
          ? staffData.reduce((sum, s) => sum + (s.total_sales || 0), 0) / staffData.length 
          : 0
      }
    });

  } catch (error) {
    console.error('Error generating staff report:', error);
    return c.json({ error: 'Failed to generate staff report' }, 500);
  }
});

// Revenue chart data for visualizations
analytics.get('/revenue-chart', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { period = '30d', groupBy = 'day' } = c.req.query();

    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now - 7*24*60*60*1000);
        break;
      case '30d':
        startDate = new Date(now - 30*24*60*60*1000);
        break;
      case '90d':
        startDate = new Date(now - 90*24*60*60*1000);
        break;
      case '1y':
        startDate = new Date(now - 365*24*60*60*1000);
        break;
      default:
        startDate = new Date(now - 30*24*60*60*1000);
    }

    let groupByClause = '';
    let selectGroup = '';
    
    switch (groupBy) {
      case 'hour':
        selectGroup = `strftime('%Y-%m-%d %H:00:00', created_at) as period`;
        groupByClause = `GROUP BY strftime('%Y-%m-%d %H', created_at)`;
        break;
      case 'day':
        selectGroup = `DATE(created_at) as period`;
        groupByClause = `GROUP BY DATE(created_at)`;
        break;
      case 'week':
        selectGroup = `strftime('%Y-W%W', created_at) as period`;
        groupByClause = `GROUP BY strftime('%Y-W%W', created_at)`;
        break;
      case 'month':
        selectGroup = `strftime('%Y-%m', created_at) as period`;
        groupByClause = `GROUP BY strftime('%Y-%m', created_at)`;
        break;
    }

    const chartQuery = `
      SELECT 
        ${selectGroup},
        COUNT(*) as orders,
        SUM(total_amount) as revenue,
        SUM(tax_amount) as tax,
        SUM(discount_amount) as discount,
        AVG(total_amount) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders 
      WHERE created_at >= ? AND status != 'cancelled'
      ${groupByClause}
      ORDER BY period ASC
    `;

    const stmt = c.env.DB.prepare(chartQuery);
    const { results } = await stmt.bind(startDate.toISOString()).all();

    return c.json({
      period,
      groupBy,
      data: results
    });

  } catch (error) {
    console.error('Error generating revenue chart:', error);
    return c.json({ error: 'Failed to generate revenue chart data' }, 500);
  }
});

// Product chart data for visualizations
analytics.get('/product-chart', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { period = '30d', type = 'top-selling' } = c.req.query();

    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now - 7*24*60*60*1000);
        break;
      case '30d':
        startDate = new Date(now - 30*24*60*60*1000);
        break;
      case '90d':
        startDate = new Date(now - 90*24*60*60*1000);
        break;
      default:
        startDate = new Date(now - 30*24*60*60*1000);
    }

    let query = '';
    let limit = 10;

    switch (type) {
      case 'top-selling':
        query = `
          SELECT 
            p.name,
            p.sku,
            SUM(oi.quantity) as quantity,
            SUM(oi.subtotal) as revenue
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= ? AND o.status != 'cancelled'
          GROUP BY p.id
          ORDER BY quantity DESC
          LIMIT ?
        `;
        break;
      case 'top-revenue':
        query = `
          SELECT 
            p.name,
            p.sku,
            SUM(oi.quantity) as quantity,
            SUM(oi.subtotal) as revenue
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= ? AND o.status != 'cancelled'
          GROUP BY p.id
          ORDER BY revenue DESC
          LIMIT ?
        `;
        break;
      case 'categories':
        query = `
          SELECT 
            c.name,
            COUNT(DISTINCT p.id) as product_count,
            SUM(oi.quantity) as quantity,
            SUM(oi.subtotal) as revenue
          FROM categories c
          JOIN products p ON c.id = p.category_id
          JOIN order_items oi ON p.id = oi.product_id
          JOIN orders o ON oi.order_id = o.id
          WHERE o.created_at >= ? AND o.status != 'cancelled'
          GROUP BY c.id
          ORDER BY revenue DESC
          LIMIT ?
        `;
        break;
    }

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(startDate.toISOString(), limit).all();

    return c.json({
      period,
      type,
      data: results
    });

  } catch (error) {
    console.error('Error generating product chart:', error);
    return c.json({ error: 'Failed to generate product chart data' }, 500);
  }
});

// Real-time statistics
analytics.get('/realtime', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's statistics
    const todayStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as orders_today,
        SUM(total_amount) as revenue_today,
        COUNT(DISTINCT customer_id) as customers_today,
        COUNT(DISTINCT staff_id) as active_staff_today
      FROM orders 
      WHERE DATE(created_at) = ? AND status != 'cancelled'
    `);
    const { results: todayStats } = await todayStmt.bind(today).all();

    // Current hour statistics
    const currentHour = new Date().getHours();
    const hourStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as orders_this_hour,
        SUM(total_amount) as revenue_this_hour
      FROM orders 
      WHERE DATE(created_at) = ? AND CAST(strftime('%H', created_at) AS INTEGER) = ? AND status != 'cancelled'
    `);
    const { results: hourStats } = await hourStmt.bind(today, currentHour).all();

    // Recent orders
    const recentOrdersStmt = c.env.DB.prepare(`
      SELECT 
        o.id,
        o.total_amount,
        o.created_at,
        c.name as customer_name,
        u.name as staff_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN staff s ON o.staff_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE o.status != 'cancelled'
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    const { results: recentOrders } = await recentOrdersStmt.all();

    // Low stock alerts
    const lowStockStmt = c.env.DB.prepare(`
      SELECT 
        id,
        name,
        sku,
        current_stock,
        low_stock_threshold
      FROM products 
      WHERE current_stock <= low_stock_threshold AND active = 1
      ORDER BY (current_stock - low_stock_threshold) ASC
      LIMIT 5
    `);
    const { results: lowStockItems } = await lowStockStmt.all();

    return c.json({
      timestamp: new Date().toISOString(),
      today: todayStats[0] || {},
      thisHour: hourStats[0] || {},
      recentOrders,
      lowStockAlerts: lowStockItems
    });

  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    return c.json({ error: 'Failed to fetch real-time statistics' }, 500);
  }
});

// Export report data
analytics.get('/export/:type', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { type } = c.req.param();
    const { format = 'json', ...params } = c.req.query();

    let data = {};
    
    switch (type) {
      case 'sales':
        // Reuse sales report logic
        const salesResponse = await analytics.handlers['/sales'][0](
          { ...c, req: { ...c.req, query: () => params } }
        );
        data = await salesResponse.json();
        break;
      case 'products':
        // Reuse products report logic
        const productsResponse = await analytics.handlers['/products'][0](
          { ...c, req: { ...c.req, query: () => params } }
        );
        data = await productsResponse.json();
        break;
      case 'customers':
        // Reuse customers report logic
        const customersResponse = await analytics.handlers['/customers'][0](
          { ...c, req: { ...c.req, query: () => params } }
        );
        data = await customersResponse.json();
        break;
      default:
        return c.json({ error: 'Invalid export type' }, 400);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return c.json(data);

  } catch (error) {
    console.error('Error exporting report:', error);
    return c.json({ error: 'Failed to export report' }, 500);
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
    return '';
  }

  const headers = Object.keys(data.data[0]);
  const csvContent = [
    headers.join(','),
    ...data.data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

export default analytics;