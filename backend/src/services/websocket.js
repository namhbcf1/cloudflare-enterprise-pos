// backend/src/services/websocket.js
// Enterprise POS System - WebSocket Service using Cloudflare Durable Objects
// Real-time updates for orders, inventory, staff activities, and notifications

import { Hono } from 'hono';
import { DatabaseService } from './database.js';

// Durable Object for WebSocket connections
export class WebSocketDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connections = new Map();
    this.rooms = new Map(); // For grouping connections
    this.db = new DatabaseService(env.DB);
  }

  async fetch(request) {
    const app = new Hono();

    // WebSocket upgrade endpoint
    app.get('/ws', async (c) => {
      const upgradeHeader = c.req.header('upgrade');
      if (upgradeHeader !== 'websocket') {
        return c.text('Expected Upgrade: websocket', 426);
      }

      // Extract auth token from query params
      const url = new URL(c.req.url);
      const token = url.searchParams.get('token');
      
      if (!token) {
        return c.text('Authentication required', 401);
      }

      // Verify JWT token
      const user = await this.verifyToken(token);
      if (!user) {
        return c.text('Invalid token', 401);
      }

      // Create WebSocket pair
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      // Accept the WebSocket connection
      server.accept();

      // Store connection with user info
      const connectionId = this.generateConnectionId();
      const connection = {
        id: connectionId,
        websocket: server,
        user: user,
        rooms: new Set(),
        lastActivity: Date.now(),
        metadata: {
          userAgent: c.req.header('user-agent'),
          ip: c.req.header('cf-connecting-ip'),
          connectedAt: new Date().toISOString()
        }
      };

      this.connections.set(connectionId, connection);

      // Set up event handlers
      server.addEventListener('message', (event) => {
        this.handleMessage(connectionId, event.data);
      });

      server.addEventListener('close', () => {
        this.handleDisconnection(connectionId);
      });

      server.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(connectionId);
      });

      // Join default rooms based on user role
      this.joinDefaultRooms(connectionId);

      // Send welcome message
      this.sendToConnection(connectionId, {
        type: 'connection_established',
        data: {
          connectionId,
          user: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          serverTime: new Date().toISOString()
        }
      });

      // Notify about new connection
      this.broadcastToRoom('admin', {
        type: 'user_connected',
        data: {
          user: { id: user.id, name: user.name, role: user.role },
          timestamp: new Date().toISOString()
        }
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    });

    return app.fetch(request);
  }

  async verifyToken(token) {
    try {
      // Decode JWT token (simplified - in production use proper JWT verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }

      // Get user details from database
      const user = await this.db.findById('users', payload.sub);
      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  joinDefaultRooms(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { user } = connection;
    
    // All users join general room
    this.joinRoom(connectionId, 'general');

    // Role-based rooms
    if (user.role === 'admin' || user.role === 'manager') {
      this.joinRoom(connectionId, 'admin');
      this.joinRoom(connectionId, 'analytics');
    }

    if (user.role === 'cashier' || user.role === 'staff') {
      this.joinRoom(connectionId, 'pos');
    }

    // Staff-specific room
    if (user.staffId) {
      this.joinRoom(connectionId, `staff_${user.staffId}`);
    }

    // Store-specific room (if multi-store)
    if (user.storeId) {
      this.joinRoom(connectionId, `store_${user.storeId}`);
    }
  }

  joinRoom(connectionId, roomName) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    // Add connection to room
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(connectionId);
    connection.rooms.add(roomName);

    // Notify about room join
    this.sendToConnection(connectionId, {
      type: 'room_joined',
      data: { room: roomName, timestamp: new Date().toISOString() }
    });

    return true;
  }

  leaveRoom(connectionId, roomName) {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    // Remove connection from room
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(connectionId);
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }
    }
    connection.rooms.delete(roomName);

    // Notify about room leave
    this.sendToConnection(connectionId, {
      type: 'room_left',
      data: { room: roomName, timestamp: new Date().toISOString() }
    });

    return true;
  }

  async handleMessage(connectionId, messageData) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      const message = JSON.parse(messageData);
      connection.lastActivity = Date.now();

      switch (message.type) {
        case 'ping':
          this.sendToConnection(connectionId, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() }
          });
          break;

        case 'join_room':
          this.joinRoom(connectionId, message.data.room);
          break;

        case 'leave_room':
          this.leaveRoom(connectionId, message.data.room);
          break;

        case 'broadcast_message':
          await this.handleBroadcastMessage(connectionId, message.data);
          break;

        case 'private_message':
          await this.handlePrivateMessage(connectionId, message.data);
          break;

        case 'pos_activity':
          await this.handlePOSActivity(connectionId, message.data);
          break;

        case 'inventory_update':
          await this.handleInventoryUpdate(connectionId, message.data);
          break;

        case 'staff_status_update':
          await this.handleStaffStatusUpdate(connectionId, message.data);
          break;

        case 'request_data':
          await this.handleDataRequest(connectionId, message.data);
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Failed to process message' }
      });
    }
  }

  async handleBroadcastMessage(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { room, message, priority = 'normal' } = data;

    // Check if user has permission to broadcast to this room
    if (!this.canBroadcastToRoom(connection.user, room)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'No permission to broadcast to this room' }
      });
      return;
    }

    // Broadcast message to room
    this.broadcastToRoom(room, {
      type: 'broadcast_message',
      data: {
        from: {
          id: connection.user.id,
          name: connection.user.name,
          role: connection.user.role
        },
        message,
        priority,
        room,
        timestamp: new Date().toISOString()
      }
    }, connectionId); // Exclude sender

    // Log broadcast for audit
    await this.logActivity('broadcast', {
      from_user_id: connection.user.id,
      room,
      message,
      priority
    });
  }

  async handlePrivateMessage(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { toUserId, message } = data;

    // Find target user's connections
    const targetConnections = Array.from(this.connections.values())
      .filter(conn => conn.user.id === toUserId);

    if (targetConnections.length === 0) {
      this.sendToConnection(connectionId, {
        type: 'message_delivery_failed',
        data: { toUserId, reason: 'User not online' }
      });
      return;
    }

    // Send to all target user's connections
    targetConnections.forEach(targetConn => {
      this.sendToConnection(targetConn.id, {
        type: 'private_message',
        data: {
          from: {
            id: connection.user.id,
            name: connection.user.name,
            role: connection.user.role
          },
          message,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Confirm delivery to sender
    this.sendToConnection(connectionId, {
      type: 'message_delivered',
      data: { toUserId, timestamp: new Date().toISOString() }
    });
  }

  async handlePOSActivity(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { activity, details } = data;

    // Broadcast POS activity to relevant rooms
    const activityMessage = {
      type: 'pos_activity',
      data: {
        staff: {
          id: connection.user.id,
          name: connection.user.name
        },
        activity,
        details,
        timestamp: new Date().toISOString()
      }
    };

    // Broadcast to POS and admin rooms
    this.broadcastToRoom('pos', activityMessage);
    this.broadcastToRoom('admin', activityMessage);

    // Log POS activity
    await this.logActivity('pos_activity', {
      staff_id: connection.user.staffId,
      activity,
      details: JSON.stringify(details)
    });

    // Update real-time analytics if it's a sale
    if (activity === 'sale_completed') {
      await this.updateRealTimeAnalytics(details);
    }
  }

  async handleInventoryUpdate(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Check permissions
    if (!['admin', 'manager'].includes(connection.user.role)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Insufficient permissions for inventory updates' }
      });
      return;
    }

    const { productId, oldStock, newStock, reason } = data;

    // Update database
    await this.db.update('products', productId, {
      current_stock: newStock,
      updated_at: new Date().toISOString()
    });

    // Log inventory change
    await this.db.insert('inventory_logs', {
      product_id: productId,
      old_stock: oldStock,
      new_stock: newStock,
      change_amount: newStock - oldStock,
      reason: reason || 'Manual adjustment',
      staff_id: connection.user.staffId,
      created_at: new Date().toISOString()
    });

    // Broadcast inventory update
    this.broadcastToRoom('admin', {
      type: 'inventory_updated',
      data: {
        productId,
        oldStock,
        newStock,
        changeAmount: newStock - oldStock,
        reason,
        updatedBy: connection.user.name,
        timestamp: new Date().toISOString()
      }
    });

    // Check for low stock alerts
    const product = await this.db.findById('products', productId);
    if (product && newStock <= product.low_stock_threshold) {
      this.broadcastToRoom('admin', {
        type: 'low_stock_alert',
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            currentStock: newStock,
            threshold: product.low_stock_threshold
          },
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  async handleStaffStatusUpdate(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { status, location, activity } = data;

    // Update staff status in database
    await this.db.query(`
      UPDATE staff_stats 
      SET last_activity = ?, status = ?
      WHERE staff_id = ?
    `, [new Date().toISOString(), status, connection.user.staffId]);

    // Broadcast status update
    this.broadcastToRoom('admin', {
      type: 'staff_status_updated',
      data: {
        staff: {
          id: connection.user.staffId,
          name: connection.user.name,
          role: connection.user.role
        },
        status,
        location,
        activity,
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleDataRequest(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { requestType, params } = data;

    try {
      let responseData = {};

      switch (requestType) {
        case 'live_analytics':
          responseData = await this.getLiveAnalytics();
          break;

        case 'online_users':
          responseData = this.getOnlineUsers();
          break;

        case 'recent_orders':
          responseData = await this.getRecentOrders(params?.limit || 10);
          break;

        case 'low_stock_items':
          responseData = await this.getLowStockItems();
          break;

        case 'staff_activity':
          responseData = await this.getStaffActivity();
          break;

        default:
          throw new Error(`Unknown request type: ${requestType}`);
      }

      this.sendToConnection(connectionId, {
        type: 'data_response',
        data: {
          requestType,
          data: responseData,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.sendToConnection(connectionId, {
        type: 'data_error',
        data: {
          requestType,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  handleDisconnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from all rooms
    connection.rooms.forEach(roomName => {
      if (this.rooms.has(roomName)) {
        this.rooms.get(roomName).delete(connectionId);
        if (this.rooms.get(roomName).size === 0) {
          this.rooms.delete(roomName);
        }
      }
    });

    // Notify about disconnection
    this.broadcastToRoom('admin', {
      type: 'user_disconnected',
      data: {
        user: {
          id: connection.user.id,
          name: connection.user.name,
          role: connection.user.role
        },
        sessionDuration: Date.now() - new Date(connection.metadata.connectedAt).getTime(),
        timestamp: new Date().toISOString()
      }
    });

    // Remove connection
    this.connections.delete(connectionId);

    console.log(`Connection ${connectionId} disconnected`);
  }

  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.websocket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      this.handleDisconnection(connectionId);
      return false;
    }
  }

  broadcastToRoom(roomName, message, excludeConnectionId = null) {
    const room = this.rooms.get(roomName);
    if (!room) return 0;

    let sentCount = 0;
    room.forEach(connectionId => {
      if (connectionId !== excludeConnectionId) {
        if (this.sendToConnection(connectionId, message)) {
          sentCount++;
        }
      }
    });

    return sentCount;
  }

  canBroadcastToRoom(user, roomName) {
    // Admin and managers can broadcast to any room
    if (['admin', 'manager'].includes(user.role)) {
      return true;
    }

    // Staff can broadcast to pos and general rooms
    if (['cashier', 'staff'].includes(user.role) && ['pos', 'general'].includes(roomName)) {
      return true;
    }

    return false;
  }

  async logActivity(type, data) {
    try {
      await this.db.insert('activity_logs', {
        type,
        data: JSON.stringify(data),
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  async updateRealTimeAnalytics(saleDetails) {
    // Update KV store with real-time metrics
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      
      // Update daily totals
      const dailyKey = `analytics:daily:${today}`;
      let dailyData = await this.env.KV.get(dailyKey, 'json') || {
        orders: 0,
        revenue: 0,
        customers: new Set()
      };
      
      dailyData.orders += 1;
      dailyData.revenue += saleDetails.total || 0;
      if (saleDetails.customerId) {
        dailyData.customers.add(saleDetails.customerId);
      }
      
      await this.env.KV.put(dailyKey, JSON.stringify({
        ...dailyData,
        customers: Array.from(dailyData.customers)
      }), { expirationTtl: 86400 * 7 }); // 7 days

      // Update hourly totals
      const hourlyKey = `analytics:hourly:${today}:${currentHour}`;
      let hourlyData = await this.env.KV.get(hourlyKey, 'json') || {
        orders: 0,
        revenue: 0
      };
      
      hourlyData.orders += 1;
      hourlyData.revenue += saleDetails.total || 0;
      
      await this.env.KV.put(hourlyKey, JSON.stringify(hourlyData), { 
        expirationTtl: 86400 * 2 
      }); // 2 days

      // Broadcast updated analytics
      this.broadcastToRoom('admin', {
        type: 'analytics_updated',
        data: {
          daily: dailyData,
          hourly: hourlyData,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error updating real-time analytics:', error);
    }
  }

  async getLiveAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    // Get today's data
    const dailyData = await this.env.KV.get(`analytics:daily:${today}`, 'json') || {
      orders: 0,
      revenue: 0,
      customers: []
    };

    // Get current hour's data
    const hourlyData = await this.env.KV.get(`analytics:hourly:${today}:${currentHour}`, 'json') || {
      orders: 0,
      revenue: 0
    };

    // Get last 24 hours breakdown
    const hourlyBreakdown = [];
    for (let i = 23; i >= 0; i--) {
      const checkDate = new Date(Date.now() - i * 60 * 60 * 1000);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hourStr = checkDate.getHours();
      
      const data = await this.env.KV.get(`analytics:hourly:${dateStr}:${hourStr}`, 'json') || {
        orders: 0,
        revenue: 0
      };
      
      hourlyBreakdown.push({
        hour: `${dateStr} ${hourStr.toString().padStart(2, '0')}:00`,
        ...data
      });
    }

    return {
      today: dailyData,
      currentHour: hourlyData,
      hourlyBreakdown,
      onlineUsers: this.connections.size
    };
  }

  getOnlineUsers() {
    const users = Array.from(this.connections.values()).map(conn => ({
      id: conn.user.id,
      name: conn.user.name,
      role: conn.user.role,
      connectedAt: conn.metadata.connectedAt,
      lastActivity: new Date(conn.lastActivity).toISOString(),
      rooms: Array.from(conn.rooms)
    }));

    return {
      total: users.length,
      users,
      byRole: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {})
    };
  }

  async getRecentOrders(limit = 10) {
    const orders = await this.db.query(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        c.name as customer_name,
        u.name as staff_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN staff s ON o.staff_id = s.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT ?
    `, [limit]);

    return orders;
  }

  async getLowStockItems() {
    const items = await this.db.query(`
      SELECT 
        id,
        name,
        sku,
        current_stock,
        low_stock_threshold,
        price
      FROM products 
      WHERE current_stock <= low_stock_threshold 
        AND active = 1
      ORDER BY (current_stock - low_stock_threshold) ASC
      LIMIT 20
    `);

    return items;
  }

  async getStaffActivity() {
    const activity = await this.db.query(`
      SELECT 
        u.name as staff_name,
        s.role,
        st.last_activity,
        st.status,
        COUNT(o.id) as todays_orders
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN staff_stats st ON s.id = st.staff_id
      LEFT JOIN orders o ON s.id = o.staff_id 
        AND DATE(o.created_at) = DATE('now')
        AND o.status != 'cancelled'
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY todays_orders DESC
    `);

    return activity;
  }

  // Cleanup inactive connections
  async cleanup() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    Array.from(this.connections.entries()).forEach(([connectionId, connection]) => {
      if (now - connection.lastActivity > inactiveThreshold) {
        console.log(`Cleaning up inactive connection: ${connectionId}`);
        this.handleDisconnection(connectionId);
      }
    });
  }
}

// WebSocket service helper functions for use in other routes
export class WebSocketService {
  constructor(env) {
    this.env = env;
  }

  async broadcast(roomName, message, metadata = {}) {
    try {
      // Get Durable Object
      const id = this.env.WEBSOCKET_DO.idFromName('websocket-handler');
      const obj = this.env.WEBSOCKET_DO.get(id);

      // Send broadcast request
      const response = await obj.fetch('https://websocket/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomName,
          message,
          metadata,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error broadcasting message:', error);
      return false;
    }
  }

  async notifyOrderUpdate(order, type = 'order_updated') {
    return this.broadcast('pos', {
      type,
      data: {
        order,
        timestamp: new Date().toISOString()
      }
    });
  }

  async notifyInventoryChange(productId, oldStock, newStock, reason) {
    return this.broadcast('admin', {
      type: 'inventory_changed',
      data: {
        productId,
        oldStock,
        newStock,
        changeAmount: newStock - oldStock,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  }

  async notifyStaffAchievement(staffId, achievement) {
    return this.broadcast(`staff_${staffId}`, {
      type: 'achievement_unlocked',
      data: {
        achievement,
        timestamp: new Date().toISOString()
      }
    });
  }

  async notifySystemAlert(message, priority = 'medium') {
    return this.broadcast('admin', {
      type: 'system_alert',
      data: {
        message,
        priority,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export default WebSocketService;