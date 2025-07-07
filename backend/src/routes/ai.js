// backend/src/routes/ai.js
// Enterprise POS System - AI Features with Cloudflare AI
// Product recommendations, demand forecasting, price optimization, and intelligent insights

import { Hono } from 'hono';
import { auth } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';
import { DatabaseService } from '../services/database.js';

const ai = new Hono();

// Get personalized product recommendations
ai.post('/recommendations', auth, async (c) => {
  try {
    const { customerId, context = {}, limit = 10 } = await c.req.json();
    const db = new DatabaseService(c.env.DB);

    // Get customer purchase history
    const customerHistory = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.category_id,
        c.name as category_name,
        SUM(oi.quantity) as purchase_count,
        MAX(o.created_at) as last_purchase,
        AVG(oi.unit_price) as avg_price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.customer_id = ? AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY purchase_count DESC, last_purchase DESC
    `, [customerId]);

    // Get similar customers (collaborative filtering)
    const similarCustomers = await db.query(`
      SELECT DISTINCT o2.customer_id, COUNT(*) as common_products
      FROM orders o1
      JOIN order_items oi1 ON o1.id = oi1.order_id
      JOIN order_items oi2 ON oi1.product_id = oi2.product_id
      JOIN orders o2 ON oi2.order_id = o2.id
      WHERE o1.customer_id = ? AND o2.customer_id != ? 
        AND o1.status != 'cancelled' AND o2.status != 'cancelled'
      GROUP BY o2.customer_id
      HAVING common_products >= 2
      ORDER BY common_products DESC
      LIMIT 20
    `, [customerId, customerId]);

    // Get trending products
    const trendingProducts = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.category_id,
        c.name as category_name,
        COUNT(oi.id) as recent_sales,
        AVG(oi.unit_price) as avg_selling_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= datetime('now', '-30 days') 
        AND o.status != 'cancelled'
        AND p.active = 1
        AND p.current_stock > 0
      GROUP BY p.id
      ORDER BY recent_sales DESC
      LIMIT 50
    `);

    // Prepare data for AI model
    const customerPreferences = {
      categories: customerHistory.reduce((acc, item) => {
        acc[item.category_name] = (acc[item.category_name] || 0) + item.purchase_count;
        return acc;
      }, {}),
      priceRange: {
        min: Math.min(...customerHistory.map(h => h.avg_price)),
        max: Math.max(...customerHistory.map(h => h.avg_price)),
        avg: customerHistory.reduce((sum, h) => sum + h.avg_price, 0) / customerHistory.length
      },
      purchaseFrequency: customerHistory.length,
      lastPurchase: customerHistory[0]?.last_purchase
    };

    // Use Cloudflare AI for recommendation generation
    const prompt = `
    Based on the following customer data, recommend ${limit} products:
    
    Customer Purchase History:
    ${JSON.stringify(customerHistory.slice(0, 10), null, 2)}
    
    Customer Preferences:
    ${JSON.stringify(customerPreferences, null, 2)}
    
    Trending Products:
    ${JSON.stringify(trendingProducts.slice(0, 20), null, 2)}
    
    Context: ${JSON.stringify(context)}
    
    Please provide recommendations in JSON format with the following structure:
    {
      "recommendations": [
        {
          "product_id": number,
          "reason": "string explaining why this product is recommended",
          "confidence": number between 0-1,
          "category": "string"
        }
      ]
    }
    
    Focus on products the customer hasn't purchased recently but align with their preferences.
    `;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a product recommendation AI for a retail POS system. Provide personalized recommendations based on customer data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let recommendations = [];
    try {
      const parsedResponse = JSON.parse(aiResponse.response);
      recommendations = parsedResponse.recommendations || [];
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Fallback to rule-based recommendations
      recommendations = generateFallbackRecommendations(customerHistory, trendingProducts, limit);
    }

    // Enhance recommendations with product details
    const enhancedRecommendations = await Promise.all(
      recommendations.slice(0, limit).map(async (rec) => {
        const product = await db.findById('products', rec.product_id);
        if (product && product.active && product.current_stock > 0) {
          return {
            ...product,
            recommendation_reason: rec.reason,
            confidence: rec.confidence,
            ai_generated: true
          };
        }
        return null;
      })
    );

    // Filter out null results and add fallbacks if needed
    const validRecommendations = enhancedRecommendations.filter(Boolean);
    
    if (validRecommendations.length < limit) {
      const fallbacks = generateFallbackRecommendations(
        customerHistory, 
        trendingProducts, 
        limit - validRecommendations.length
      );
      validRecommendations.push(...fallbacks);
    }

    // Store recommendations for analytics
    for (const rec of validRecommendations.slice(0, limit)) {
      await db.insert('ai_recommendations', {
        customer_id: customerId,
        product_id: rec.id,
        reason: rec.recommendation_reason || 'System generated',
        confidence: rec.confidence || 0.5,
        context: JSON.stringify(context),
        created_at: new Date().toISOString()
      });
    }

    return c.json({
      customer_id: customerId,
      recommendations: validRecommendations.slice(0, limit),
      generated_at: new Date().toISOString(),
      ai_powered: true
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return c.json({ error: 'Failed to generate recommendations' }, 500);
  }
});

// Generate demand forecast for products
ai.get('/demand-forecast', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { productId, period = '30d' } = c.req.query();
    const db = new DatabaseService(c.env.DB);

    if (!productId) {
      return c.json({ error: 'Product ID is required' }, 400);
    }

    // Get historical sales data
    const salesHistory = await db.query(`
      SELECT 
        DATE(o.created_at) as sale_date,
        SUM(oi.quantity) as quantity_sold,
        COUNT(DISTINCT o.id) as order_count,
        AVG(oi.unit_price) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.status != 'cancelled'
        AND o.created_at >= datetime('now', '-180 days')
      GROUP BY DATE(o.created_at)
      ORDER BY sale_date ASC
    `, [productId]);

    // Get product details
    const product = await db.findById('products', productId);
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Get seasonal patterns
    const seasonalData = await db.query(`
      SELECT 
        strftime('%w', o.created_at) as day_of_week,
        strftime('%m', o.created_at) as month,
        AVG(oi.quantity) as avg_quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.status != 'cancelled'
        AND o.created_at >= datetime('now', '-365 days')
      GROUP BY day_of_week, month
    `, [productId]);

    // Prepare data for AI forecasting
    const forecastPrompt = `
    Analyze the following sales data and provide a demand forecast:
    
    Product: ${product.name} (SKU: ${product.sku})
    Current Stock: ${product.current_stock}
    
    Historical Sales Data (last 180 days):
    ${JSON.stringify(salesHistory, null, 2)}
    
    Seasonal Patterns:
    ${JSON.stringify(seasonalData, null, 2)}
    
    Please provide a ${period} forecast in JSON format:
    {
      "forecast": {
        "predicted_demand": number,
        "confidence_level": number between 0-1,
        "trend": "increasing|decreasing|stable",
        "seasonal_factors": ["factor1", "factor2"],
        "recommendations": {
          "optimal_stock_level": number,
          "reorder_point": number,
          "suggested_order_quantity": number
        }
      }
    }
    
    Consider historical trends, seasonality, and current stock levels.
    `;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a demand forecasting AI for inventory management. Analyze sales patterns and predict future demand.'
        },
        {
          role: 'user',
          content: forecastPrompt
        }
      ]
    });

    let forecast = {};
    try {
      const parsedResponse = JSON.parse(aiResponse.response);
      forecast = parsedResponse.forecast || {};
    } catch (error) {
      console.error('Error parsing forecast response:', error);
      // Fallback to statistical forecasting
      forecast = generateStatisticalForecast(salesHistory, period);
    }

    // Store forecast for tracking accuracy
    await db.insert('forecasts', {
      product_id: productId,
      period,
      predicted_demand: forecast.predicted_demand || 0,
      confidence_level: forecast.confidence_level || 0.5,
      trend: forecast.trend || 'stable',
      recommendations: JSON.stringify(forecast.recommendations || {}),
      created_at: new Date().toISOString(),
      for_date: new Date(Date.now() + getPeriodDays(period) * 24 * 60 * 60 * 1000).toISOString()
    });

    return c.json({
      product_id: productId,
      product: product,
      period,
      forecast,
      historical_data: salesHistory,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating demand forecast:', error);
    return c.json({ error: 'Failed to generate demand forecast' }, 500);
  }
});

// Sales prediction for business planning
ai.get('/sales-predict', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { period = '30d' } = c.req.query();
    const db = new DatabaseService(c.env.DB);

    // Get historical sales data
    const salesHistory = await db.query(`
      SELECT 
        DATE(created_at) as sale_date,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM orders 
      WHERE status != 'cancelled' AND created_at >= datetime('now', '-365 days')
      GROUP BY DATE(created_at)
      ORDER BY sale_date ASC
    `);

    // Get external factors
    const externalFactors = {
      day_of_week_patterns: await db.query(`
        SELECT 
          strftime('%w', created_at) as day_of_week,
          AVG(total_amount) as avg_revenue
        FROM orders 
        WHERE status != 'cancelled' AND created_at >= datetime('now', '-90 days')
        GROUP BY day_of_week
      `),
      monthly_patterns: await db.query(`
        SELECT 
          strftime('%m', created_at) as month,
          AVG(total_amount) as avg_revenue
        FROM orders 
        WHERE status != 'cancelled' AND created_at >= datetime('now', '-365 days')
        GROUP BY month
      `),
      current_trends: await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          SUM(total_amount) as revenue
        FROM orders 
        WHERE status != 'cancelled' AND created_at >= datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `)
    };

    const predictionPrompt = `
    Analyze the sales data and predict future performance:
    
    Historical Sales (last 365 days):
    ${JSON.stringify(salesHistory.slice(-90), null, 2)}
    
    Patterns and Trends:
    ${JSON.stringify(externalFactors, null, 2)}
    
    Provide a ${period} sales prediction in JSON format:
    {
      "prediction": {
        "total_revenue": number,
        "total_orders": number,
        "avg_order_value": number,
        "growth_rate": number,
        "confidence_level": number between 0-1,
        "key_factors": ["factor1", "factor2"],
        "daily_breakdown": [
          {"date": "YYYY-MM-DD", "predicted_revenue": number, "predicted_orders": number}
        ],
        "recommendations": [
          "recommendation 1",
          "recommendation 2"
        ]
      }
    }
    
    Consider seasonal trends, recent performance, and growth patterns.
    `;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a sales forecasting AI that predicts future business performance based on historical data and trends.'
        },
        {
          role: 'user',
          content: predictionPrompt
        }
      ]
    });

    let prediction = {};
    try {
      const parsedResponse = JSON.parse(aiResponse.response);
      prediction = parsedResponse.prediction || {};
    } catch (error) {
      console.error('Error parsing prediction response:', error);
      // Fallback to trend-based prediction
      prediction = generateTrendBasedPrediction(salesHistory, period);
    }

    return c.json({
      period,
      prediction,
      historical_context: {
        data_points: salesHistory.length,
        date_range: {
          start: salesHistory[0]?.sale_date,
          end: salesHistory[salesHistory.length - 1]?.sale_date
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating sales prediction:', error);
    return c.json({ error: 'Failed to generate sales prediction' }, 500);
  }
});

// Price optimization recommendations
ai.get('/price-optimization', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { productId } = c.req.query();
    const db = new DatabaseService(c.env.DB);

    if (!productId) {
      return c.json({ error: 'Product ID is required' }, 400);
    }

    const product = await db.findById('products', productId);
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    // Get price sensitivity data
    const priceHistory = await db.query(`
      SELECT 
        oi.unit_price,
        SUM(oi.quantity) as quantity_sold,
        COUNT(DISTINCT o.id) as order_count,
        AVG(o.total_amount) as avg_order_total,
        DATE(o.created_at) as sale_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.status != 'cancelled'
        AND o.created_at >= datetime('now', '-180 days')
      GROUP BY oi.unit_price, DATE(o.created_at)
      ORDER BY sale_date DESC
    `, [productId]);

    // Get competitor pricing (simulated - in real scenario would come from external sources)
    const competitorPrices = await db.query(`
      SELECT 
        p.name,
        p.price,
        p.category_id
      FROM products p
      WHERE p.category_id = ? AND p.id != ? AND p.active = 1
      ORDER BY p.price ASC
    `, [product.category_id, productId]);

    const optimizationPrompt = `
    Analyze pricing data and recommend optimal pricing strategy:
    
    Current Product:
    ${JSON.stringify(product, null, 2)}
    
    Price Performance History:
    ${JSON.stringify(priceHistory, null, 2)}
    
    Competitor Prices in Same Category:
    ${JSON.stringify(competitorPrices, null, 2)}
    
    Provide price optimization recommendations in JSON format:
    {
      "optimization": {
        "current_price": ${product.price},
        "recommended_price": number,
        "price_change_percentage": number,
        "expected_impact": {
          "demand_change": number,
          "revenue_change": number,
          "profit_margin_change": number
        },
        "confidence_level": number between 0-1,
        "strategy": "penetration|premium|competitive|value",
        "reasoning": "string explaining the recommendation",
        "implementation_timeline": "immediate|gradual|seasonal",
        "risks": ["risk1", "risk2"],
        "monitoring_metrics": ["metric1", "metric2"]
      }
    }
    
    Consider demand elasticity, competitor positioning, and profit margins.
    `;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a pricing optimization AI that analyzes market data and recommends optimal pricing strategies.'
        },
        {
          role: 'user',
          content: optimizationPrompt
        }
      ]
    });

    let optimization = {};
    try {
      const parsedResponse = JSON.parse(aiResponse.response);
      optimization = parsedResponse.optimization || {};
    } catch (error) {
      console.error('Error parsing optimization response:', error);
      // Fallback to basic optimization
      optimization = generateBasicOptimization(product, priceHistory, competitorPrices);
    }

    return c.json({
      product_id: productId,
      product,
      optimization,
      market_context: {
        competitor_count: competitorPrices.length,
        price_range: {
          min: Math.min(...competitorPrices.map(p => p.price)),
          max: Math.max(...competitorPrices.map(p => p.price)),
          avg: competitorPrices.reduce((sum, p) => sum + p.price, 0) / competitorPrices.length
        }
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating price optimization:', error);
    return c.json({ error: 'Failed to generate price optimization' }, 500);
  }
});

// Inventory alerts and recommendations
ai.get('/inventory-alerts', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const db = new DatabaseService(c.env.DB);

    // Get products needing attention
    const inventoryData = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.current_stock,
        p.low_stock_threshold,
        p.price,
        p.cost,
        c.name as category_name,
        COALESCE(sales.weekly_sales, 0) as weekly_sales,
        COALESCE(sales.monthly_sales, 0) as monthly_sales
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT 
          oi.product_id,
          SUM(CASE WHEN o.created_at >= datetime('now', '-7 days') THEN oi.quantity ELSE 0 END) as weekly_sales,
          SUM(CASE WHEN o.created_at >= datetime('now', '-30 days') THEN oi.quantity ELSE 0 END) as monthly_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled'
        GROUP BY oi.product_id
      ) sales ON p.id = sales.product_id
      WHERE p.active = 1
      ORDER BY (p.current_stock - p.low_stock_threshold) ASC
    `);

    const alertPrompt = `
    Analyze inventory data and generate intelligent alerts:
    
    Product Inventory Status:
    ${JSON.stringify(inventoryData.slice(0, 50), null, 2)}
    
    Generate inventory alerts and recommendations in JSON format:
    {
      "alerts": [
        {
          "product_id": number,
          "alert_type": "critical|warning|reorder|overstock",
          "priority": "high|medium|low",
          "message": "string describing the alert",
          "recommended_action": "string with specific action",
          "urgency_days": number
        }
      ],
      "summary": {
        "critical_items": number,
        "items_to_reorder": number,
        "overstocked_items": number,
        "total_value_at_risk": number
      },
      "recommendations": [
        "general recommendation 1",
        "general recommendation 2"
      ]
    }
    
    Consider sales velocity, stock levels, and seasonal factors.
    `;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are an inventory management AI that analyzes stock levels and sales patterns to generate actionable alerts.'
        },
        {
          role: 'user',
          content: alertPrompt
        }
      ]
    });

    let alerts = {};
    try {
      const parsedResponse = JSON.parse(aiResponse.response);
      alerts = parsedResponse;
    } catch (error) {
      console.error('Error parsing alerts response:', error);
      // Fallback to rule-based alerts
      alerts = generateRuleBasedAlerts(inventoryData);
    }

    // Store alerts for tracking
    for (const alert of alerts.alerts || []) {
      await db.insert('inventory_alerts', {
        product_id: alert.product_id,
        alert_type: alert.alert_type,
        priority: alert.priority,
        message: alert.message,
        recommended_action: alert.recommended_action,
        created_at: new Date().toISOString(),
        resolved: 0
      });
    }

    return c.json({
      ...alerts,
      generated_at: new Date().toISOString(),
      total_products_analyzed: inventoryData.length
    });

  } catch (error) {
    console.error('Error generating inventory alerts:', error);
    return c.json({ error: 'Failed to generate inventory alerts' }, 500);
  }
});

// Customer insights and behavior analysis
ai.get('/customer-insights/:customerId', auth, async (c) => {
  try {
    const { customerId } = c.req.param();
    const db = new DatabaseService(c.env.DB);

    // Get comprehensive customer data
    const customerData = await db.query(`
      SELECT 
        c.*,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_spent,
        AVG(o.total_amount) as avg_order_value,
        MIN(o.created_at) as first_order,
        MAX(o.created_at) as last_order,
        COUNT(DISTINCT oi.product_id) as unique_products_purchased
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id AND o.status != 'cancelled'
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [customerId]);

    if (customerData.length === 0) {
      return c.json({ error: 'Customer not found' }, 404);
    }

    const customer = customerData[0];

    // Get purchase patterns
    const purchasePatterns = await db.query(`
      SELECT 
        p.name as product_name,
        p.category_id,
        c.name as category_name,
        COUNT(*) as purchase_frequency,
        SUM(oi.quantity) as total_quantity,
        AVG(oi.unit_price) as avg_price_paid,
        MAX(o.created_at) as last_purchased
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.customer_id = ? AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY purchase_frequency DESC
    `, [customerId]);

    const insightsPrompt = `
    Analyze customer behavior and provide insights:
    
    Customer Profile:
    ${JSON.stringify(customer, null, 2)}
    
    Purchase Patterns:
    ${JSON.stringify(purchasePatterns.slice(0, 20), null, 2)}
    
    Generate customer insights in JSON format:
    {
      "insights": {
        "customer_segment": "vip|regular|new|at_risk|inactive",
        "buying_behavior": "frequent|occasional|seasonal|price_sensitive|premium",
        "preferred_categories": ["category1", "category2"],
        "spending_pattern": "increasing|decreasing|stable|irregular",
        "loyalty_score": number between 0-100,
        "churn_risk": "low|medium|high",
        "lifetime_value_prediction": number,
        "next_purchase_probability": number between 0-1,
        "personalization_opportunities": [
          "opportunity 1",
          "opportunity 2"
        ],
        "retention_strategies": [
          "strategy 1",
          "strategy 2"
        ]
      }
    }
    
    Focus on actionable insights for improving customer experience and retention.
    `;

    const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a customer analytics AI that analyzes purchase behavior and provides actionable business insights.'
        },
        {
          role: 'user',
          content: insightsPrompt
        }
      ]
    });

    let insights = {};
    try {
      const parsedResponse = JSON.parse(aiResponse.response);
      insights = parsedResponse.insights || {};
    } catch (error) {
      console.error('Error parsing insights response:', error);
      // Fallback to rule-based insights
      insights = generateRuleBasedInsights(customer, purchasePatterns);
    }

    return c.json({
      customer_id: customerId,
      customer_profile: customer,
      insights,
      purchase_summary: {
        total_orders: customer.total_orders,
        total_spent: customer.total_spent,
        avg_order_value: customer.avg_order_value,
        unique_products: customer.unique_products_purchased,
        account_age_days: Math.floor((new Date() - new Date(customer.created_at)) / (1000 * 60 * 60 * 24))
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating customer insights:', error);
    return c.json({ error: 'Failed to generate customer insights' }, 500);
  }
});

// Helper functions
function generateFallbackRecommendations(customerHistory, trendingProducts, limit) {
  // Simple rule-based recommendations
  const customerCategories = [...new Set(customerHistory.map(h => h.category_id))];
  
  return trendingProducts
    .filter(p => customerCategories.includes(p.category_id))
    .slice(0, limit)
    .map(p => ({
      ...p,
      recommendation_reason: 'Based on your purchase history in this category',
      confidence: 0.6,
      ai_generated: false
    }));
}

function generateStatisticalForecast(salesHistory, period) {
  if (salesHistory.length < 7) {
    return { predicted_demand: 0, confidence_level: 0.3, trend: 'insufficient_data' };
  }

  const recentSales = salesHistory.slice(-30);
  const avgDailySales = recentSales.reduce((sum, day) => sum + day.quantity_sold, 0) / recentSales.length;
  const periodDays = getPeriodDays(period);
  
  return {
    predicted_demand: Math.round(avgDailySales * periodDays),
    confidence_level: 0.7,
    trend: 'stable',
    recommendations: {
      optimal_stock_level: Math.round(avgDailySales * periodDays * 1.2),
      reorder_point: Math.round(avgDailySales * 7),
      suggested_order_quantity: Math.round(avgDailySales * periodDays)
    }
  };
}

function getPeriodDays(period) {
  const periodMap = { '7d': 7, '30d': 30, '90d': 90 };
  return periodMap[period] || 30;
}

function generateTrendBasedPrediction(salesHistory, period) {
  const recent = salesHistory.slice(-30);
  const avgRevenue = recent.reduce((sum, day) => sum + day.revenue, 0) / recent.length;
  const periodDays = getPeriodDays(period);
  
  return {
    total_revenue: Math.round(avgRevenue * periodDays),
    total_orders: Math.round((avgRevenue / 50) * periodDays), // Assume $50 avg order
    confidence_level: 0.6,
    growth_rate: 0,
    key_factors: ['Historical average', 'Seasonal stability']
  };
}

function generateBasicOptimization(product, priceHistory, competitorPrices) {
  const avgCompetitorPrice = competitorPrices.reduce((sum, p) => sum + p.price, 0) / competitorPrices.length;
  const recommendedPrice = avgCompetitorPrice * 0.95; // 5% below average
  
  return {
    current_price: product.price,
    recommended_price: recommendedPrice,
    price_change_percentage: ((recommendedPrice - product.price) / product.price * 100).toFixed(1),
    strategy: 'competitive',
    confidence_level: 0.6
  };
}

function generateRuleBasedAlerts(inventoryData) {
  const alerts = [];
  let criticalCount = 0;
  
  inventoryData.forEach(item => {
    if (item.current_stock <= 0) {
      alerts.push({
        product_id: item.id,
        alert_type: 'critical',
        priority: 'high',
        message: `${item.name} is out of stock`,
        recommended_action: 'Order immediately'
      });
      criticalCount++;
    } else if (item.current_stock <= item.low_stock_threshold) {
      alerts.push({
        product_id: item.id,
        alert_type: 'warning',
        priority: 'medium',
        message: `${item.name} is below reorder threshold`,
        recommended_action: 'Consider reordering'
      });
    }
  });
  
  return {
    alerts,
    summary: { critical_items: criticalCount, items_to_reorder: alerts.length }
  };
}

function generateRuleBasedInsights(customer, purchasePatterns) {
  const totalOrders = customer.total_orders || 0;
  const daysSinceLastOrder = customer.last_order 
    ? Math.floor((new Date() - new Date(customer.last_order)) / (1000 * 60 * 60 * 24))
    : 999;
  
  let segment = 'new';
  if (totalOrders > 10) segment = 'vip';
  else if (totalOrders > 3) segment = 'regular';
  
  let churnRisk = 'low';
  if (daysSinceLastOrder > 90) churnRisk = 'high';
  else if (daysSinceLastOrder > 30) churnRisk = 'medium';
  
  return {
    customer_segment: segment,
    loyalty_score: Math.min(100, totalOrders * 10),
    churn_risk: churnRisk,
    preferred_categories: purchasePatterns.slice(0, 3).map(p => p.category_name)
  };
}

export default ai;