// backend/src/routes/staff.js
// Enterprise POS System - Staff Management with Gamification
// Handles staff CRUD, performance tracking, badges, challenges, and leaderboards

import { Hono } from 'hono';
import { auth } from '../middleware/auth.js';
import { rbac } from '../middleware/rbac.js';
import { DatabaseService } from '../services/database.js';

const staff = new Hono();

// Get all staff members with optional filters
staff.get('/', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { page = 1, limit = 20, role, active, search } = c.req.query();
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        s.id,
        s.user_id,
        s.role,
        s.hire_date,
        s.hourly_rate,
        s.commission_rate,
        s.active,
        s.department,
        s.shift_pattern,
        u.name,
        u.email,
        u.phone,
        st.total_sales,
        st.orders_count,
        st.avg_transaction,
        st.customer_rating,
        st.badges_earned,
        st.current_level,
        st.experience_points,
        st.achievements_count
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN staff_stats st ON s.id = st.staff_id
      WHERE 1=1
    `;

    const params = [];

    if (role) {
      query += ' AND s.role = ?';
      params.push(role);
    }

    if (active !== undefined) {
      query += ' AND s.active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM staff s JOIN users u ON s.user_id = u.id WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND s.role = ?';
      countParams.push(role);
    }

    if (active !== undefined) {
      countQuery += ' AND s.active = ?';
      countParams.push(active === 'true' ? 1 : 0);
    }

    if (search) {
      countQuery += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countStmt = c.env.DB.prepare(countQuery);
    const { results: countResult } = await countStmt.bind(...countParams).all();
    const total = countResult[0]?.total || 0;

    return c.json({
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    return c.json({ error: 'Failed to fetch staff members' }, 500);
  }
});

// Get staff member by ID with detailed stats
staff.get('/:id', auth, async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    // Check if user can access this staff record (themselves or admin/manager)
    if (user.role !== 'admin' && user.role !== 'manager' && user.staffId !== parseInt(id)) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const stmt = c.env.DB.prepare(`
      SELECT 
        s.*,
        u.name,
        u.email,
        u.phone,
        u.avatar_url,
        st.total_sales,
        st.orders_count,
        st.avg_transaction,
        st.customer_rating,
        st.badges_earned,
        st.current_level,
        st.experience_points,
        st.achievements_count,
        st.total_commission,
        st.hours_worked,
        st.attendance_rate,
        st.last_activity
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN staff_stats st ON s.id = st.staff_id
      WHERE s.id = ?
    `);

    const { results } = await stmt.bind(id).all();
    
    if (results.length === 0) {
      return c.json({ error: 'Staff member not found' }, 404);
    }

    const staffMember = results[0];

    // Get recent badges
    const badgesStmt = c.env.DB.prepare(`
      SELECT b.*, sa.earned_at
      FROM badges b
      JOIN staff_achievements sa ON b.id = sa.badge_id
      WHERE sa.staff_id = ?
      ORDER BY sa.earned_at DESC
      LIMIT 10
    `);
    const { results: badges } = await badgesStmt.bind(id).all();

    // Get active challenges
    const challengesStmt = c.env.DB.prepare(`
      SELECT 
        c.*,
        sc.progress,
        sc.completed,
        sc.completed_at
      FROM challenges c
      JOIN staff_challenges sc ON c.id = sc.challenge_id
      WHERE sc.staff_id = ? AND sc.active = 1
      ORDER BY sc.created_at DESC
    `);
    const { results: challenges } = await challengesStmt.bind(id).all();

    return c.json({
      ...staffMember,
      badges,
      challenges
    });

  } catch (error) {
    console.error('Error fetching staff member:', error);
    return c.json({ error: 'Failed to fetch staff member' }, 500);
  }
});

// Create new staff member
staff.post('/', auth, rbac(['admin']), async (c) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      hourly_rate,
      commission_rate,
      department,
      shift_pattern,
      hire_date
    } = await c.req.json();

    // Validate required fields
    if (!name || !email || !password || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const db = new DatabaseService(c.env.DB);

    // Check if email already exists
    const existingUser = await db.findOne('users', { email });
    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.transaction(async () => {
      // Create user account
      const userId = await db.insert('users', {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'staff',
        created_at: new Date().toISOString()
      });

      // Create staff record
      const staffId = await db.insert('staff', {
        user_id: userId,
        role,
        hourly_rate: hourly_rate || 0,
        commission_rate: commission_rate || 0,
        department: department || 'General',
        shift_pattern: shift_pattern || 'full-time',
        hire_date: hire_date || new Date().toISOString(),
        active: 1,
        created_at: new Date().toISOString()
      });

      // Initialize staff stats
      await db.insert('staff_stats', {
        staff_id: staffId,
        total_sales: 0,
        orders_count: 0,
        avg_transaction: 0,
        customer_rating: 5.0,
        badges_earned: 0,
        current_level: 1,
        experience_points: 0,
        achievements_count: 0,
        total_commission: 0,
        hours_worked: 0,
        attendance_rate: 100.0,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      // Assign welcome badge
      const welcomeBadge = await db.findOne('badges', { name: 'Welcome to the Team' });
      if (welcomeBadge) {
        await db.insert('staff_achievements', {
          staff_id: staffId,
          badge_id: welcomeBadge.id,
          earned_at: new Date().toISOString()
        });
      }

      return { userId, staffId };
    });

    return c.json({ message: 'Staff member created successfully' }, 201);

  } catch (error) {
    console.error('Error creating staff member:', error);
    return c.json({ error: 'Failed to create staff member' }, 500);
  }
});

// Update staff member
staff.put('/:id', auth, rbac(['admin', 'manager']), async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();

    const db = new DatabaseService(c.env.DB);

    // Check if staff exists
    const existingStaff = await db.findById('staff', id);
    if (!existingStaff) {
      return c.json({ error: 'Staff member not found' }, 404);
    }

    await db.transaction(async () => {
      // Update user info if provided
      if (updates.name || updates.email || updates.phone) {
        const userUpdates = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.email) userUpdates.email = updates.email;
        if (updates.phone) userUpdates.phone = updates.phone;
        userUpdates.updated_at = new Date().toISOString();

        await db.update('users', existingStaff.user_id, userUpdates);
      }

      // Update staff info
      const staffUpdates = {};
      if (updates.role) staffUpdates.role = updates.role;
      if (updates.hourly_rate !== undefined) staffUpdates.hourly_rate = updates.hourly_rate;
      if (updates.commission_rate !== undefined) staffUpdates.commission_rate = updates.commission_rate;
      if (updates.department) staffUpdates.department = updates.department;
      if (updates.shift_pattern) staffUpdates.shift_pattern = updates.shift_pattern;
      if (updates.active !== undefined) staffUpdates.active = updates.active ? 1 : 0;
      staffUpdates.updated_at = new Date().toISOString();

      await db.update('staff', id, staffUpdates);
    });

    return c.json({ message: 'Staff member updated successfully' });

  } catch (error) {
    console.error('Error updating staff member:', error);
    return c.json({ error: 'Failed to update staff member' }, 500);
  }
});

// Get staff statistics for a specific period
staff.get('/:id/stats', auth, async (c) => {
  try {
    const { id } = c.req.param();
    const { period = '30d' } = c.req.query();

    let dateFilter = '';
    const now = new Date();
    
    switch (period) {
      case '1d':
        dateFilter = `AND o.created_at >= '${new Date(now - 24*60*60*1000).toISOString()}'`;
        break;
      case '7d':
        dateFilter = `AND o.created_at >= '${new Date(now - 7*24*60*60*1000).toISOString()}'`;
        break;
      case '30d':
        dateFilter = `AND o.created_at >= '${new Date(now - 30*24*60*60*1000).toISOString()}'`;
        break;
      case '90d':
        dateFilter = `AND o.created_at >= '${new Date(now - 90*24*60*60*1000).toISOString()}'`;
        break;
    }

    // Get sales statistics
    const salesStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(o.total_amount) as total_sales,
        AVG(o.total_amount) as avg_transaction,
        COUNT(DISTINCT o.customer_id) as unique_customers
      FROM orders o
      WHERE o.staff_id = ? ${dateFilter}
    `);

    const { results: salesStats } = await salesStmt.bind(id).all();

    // Get daily breakdown
    const dailyStmt = c.env.DB.prepare(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as orders,
        SUM(o.total_amount) as sales
      FROM orders o
      WHERE o.staff_id = ? ${dateFilter}
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `);

    const { results: dailyStats } = await dailyStmt.bind(id).all();

    // Get product performance
    const productStmt = c.env.DB.prepare(`
      SELECT 
        p.name,
        p.sku,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.staff_id = ? ${dateFilter}
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `);

    const { results: productStats } = await productStmt.bind(id).all();

    return c.json({
      period,
      summary: salesStats[0] || {},
      daily: dailyStats,
      topProducts: productStats
    });

  } catch (error) {
    console.error('Error fetching staff stats:', error);
    return c.json({ error: 'Failed to fetch staff statistics' }, 500);
  }
});

// Get staff leaderboard
staff.get('/leaderboard', auth, async (c) => {
  try {
    const { period = '30d', metric = 'sales' } = c.req.query();

    let dateFilter = '';
    const now = new Date();
    
    switch (period) {
      case '1d':
        dateFilter = `AND o.created_at >= '${new Date(now - 24*60*60*1000).toISOString()}'`;
        break;
      case '7d':
        dateFilter = `AND o.created_at >= '${new Date(now - 7*24*60*60*1000).toISOString()}'`;
        break;
      case '30d':
        dateFilter = `AND o.created_at >= '${new Date(now - 30*24*60*60*1000).toISOString()}'`;
        break;
    }

    let orderBy = 'total_sales DESC';
    if (metric === 'orders') orderBy = 'total_orders DESC';
    if (metric === 'avg_transaction') orderBy = 'avg_transaction DESC';
    if (metric === 'customers') orderBy = 'unique_customers DESC';

    const stmt = c.env.DB.prepare(`
      SELECT 
        s.id,
        u.name,
        u.avatar_url,
        s.role,
        s.department,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_sales,
        COALESCE(AVG(o.total_amount), 0) as avg_transaction,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        st.current_level,
        st.experience_points,
        st.badges_earned
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN orders o ON s.id = o.staff_id ${dateFilter}
      LEFT JOIN staff_stats st ON s.id = st.staff_id
      WHERE s.active = 1
      GROUP BY s.id
      ORDER BY ${orderBy}
      LIMIT 20
    `);

    const { results } = await stmt.all();

    // Add ranking
    const leaderboard = results.map((staff, index) => ({
      ...staff,
      rank: index + 1
    }));

    return c.json({ leaderboard, period, metric });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// Get all available badges
staff.get('/badges', auth, async (c) => {
  try {
    const stmt = c.env.DB.prepare(`
      SELECT 
        b.*,
        COUNT(sa.staff_id) as earned_by_count
      FROM badges b
      LEFT JOIN staff_achievements sa ON b.id = sa.badge_id
      GROUP BY b.id
      ORDER BY b.category, b.points_required
    `);

    const { results } = await stmt.all();

    return c.json({ badges: results });

  } catch (error) {
    console.error('Error fetching badges:', error);
    return c.json({ error: 'Failed to fetch badges' }, 500);
  }
});

// Get active challenges
staff.get('/challenges', auth, async (c) => {
  try {
    const user = c.get('user');
    
    const stmt = c.env.DB.prepare(`
      SELECT 
        c.*,
        sc.progress,
        sc.completed,
        sc.completed_at,
        CASE WHEN sc.staff_id IS NOT NULL THEN 1 ELSE 0 END as is_participating
      FROM challenges c
      LEFT JOIN staff_challenges sc ON c.id = sc.challenge_id AND sc.staff_id = ?
      WHERE c.active = 1 AND c.end_date > ?
      ORDER BY c.created_at DESC
    `);

    const { results } = await stmt.bind(user.staffId, new Date().toISOString()).all();

    return c.json({ challenges: results });

  } catch (error) {
    console.error('Error fetching challenges:', error);
    return c.json({ error: 'Failed to fetch challenges' }, 500);
  }
});

// Join a challenge
staff.post('/challenges/:challengeId/join', auth, async (c) => {
  try {
    const { challengeId } = c.req.param();
    const user = c.get('user');

    const db = new DatabaseService(c.env.DB);

    // Check if challenge exists and is active
    const challenge = await db.findById('challenges', challengeId);
    if (!challenge || !challenge.active || new Date(challenge.end_date) < new Date()) {
      return c.json({ error: 'Challenge not available' }, 400);
    }

    // Check if already participating
    const existing = await db.findOne('staff_challenges', {
      staff_id: user.staffId,
      challenge_id: challengeId
    });

    if (existing) {
      return c.json({ error: 'Already participating in this challenge' }, 409);
    }

    // Join challenge
    await db.insert('staff_challenges', {
      staff_id: user.staffId,
      challenge_id: challengeId,
      progress: 0,
      completed: 0,
      active: 1,
      created_at: new Date().toISOString()
    });

    return c.json({ message: 'Successfully joined challenge' });

  } catch (error) {
    console.error('Error joining challenge:', error);
    return c.json({ error: 'Failed to join challenge' }, 500);
  }
});

// Update challenge progress
staff.patch('/challenges/:challengeId', auth, async (c) => {
  try {
    const { challengeId } = c.req.param();
    const { progress } = await c.req.json();
    const user = c.get('user');

    const db = new DatabaseService(c.env.DB);

    // Get current challenge participation
    const participation = await db.findOne('staff_challenges', {
      staff_id: user.staffId,
      challenge_id: challengeId
    });

    if (!participation) {
      return c.json({ error: 'Not participating in this challenge' }, 404);
    }

    const challenge = await db.findById('challenges', challengeId);
    const isCompleted = progress >= challenge.target_value;

    // Update progress
    await db.update('staff_challenges', participation.id, {
      progress,
      completed: isCompleted ? 1 : 0,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    });

    // If completed, award points and check for badges
    if (isCompleted && !participation.completed) {
      await db.update('staff_stats', user.staffId, {
        experience_points: db.raw(`experience_points + ${challenge.reward_points}`)
      });

      // Check for completion badges
      // Implementation for badge awarding logic would go here
    }

    return c.json({ message: 'Challenge progress updated' });

  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return c.json({ error: 'Failed to update challenge progress' }, 500);
  }
});

// Record a sale for gamification
staff.post('/:id/sales', auth, async (c) => {
  try {
    const { id } = c.req.param();
    const { orderId, amount, itemCount, customerId } = await c.req.json();

    const db = new DatabaseService(c.env.DB);

    // Calculate experience points (1 point per dollar + bonuses)
    let expPoints = Math.floor(amount);
    
    // Bonus points for large orders
    if (amount > 100) expPoints += 10;
    if (amount > 500) expPoints += 25;
    if (itemCount > 5) expPoints += 5;

    // Update staff stats
    await db.query(`
      UPDATE staff_stats 
      SET 
        total_sales = total_sales + ?,
        orders_count = orders_count + 1,
        avg_transaction = (total_sales + ?) / (orders_count + 1),
        experience_points = experience_points + ?,
        last_activity = ?
      WHERE staff_id = ?
    `, [amount, amount, expPoints, new Date().toISOString(), id]);

    // Update level based on experience points
    const stats = await db.findOne('staff_stats', { staff_id: id });
    const newLevel = Math.floor(stats.experience_points / 1000) + 1;
    
    if (newLevel > stats.current_level) {
      await db.update('staff_stats', stats.id, { current_level: newLevel });
      
      // Award level-up badge
      // Badge awarding logic would go here
    }

    // Update active challenges
    await this.updateChallengeProgress(db, id, 'sales', amount);

    return c.json({ 
      message: 'Sale recorded successfully',
      expPoints,
      newLevel: newLevel > stats.current_level ? newLevel : null
    });

  } catch (error) {
    console.error('Error recording sale:', error);
    return c.json({ error: 'Failed to record sale' }, 500);
  }
});

// Helper function to update challenge progress
async function updateChallengeProgress(db, staffId, type, value) {
  try {
    const challenges = await db.query(`
      SELECT sc.*, c.type, c.target_value
      FROM staff_challenges sc
      JOIN challenges c ON sc.challenge_id = c.id
      WHERE sc.staff_id = ? AND sc.active = 1 AND sc.completed = 0 AND c.type = ?
    `, [staffId, type]);

    for (const challenge of challenges) {
      const newProgress = challenge.progress + value;
      const isCompleted = newProgress >= challenge.target_value;

      await db.update('staff_challenges', challenge.id, {
        progress: newProgress,
        completed: isCompleted ? 1 : 0,
        completed_at: isCompleted ? new Date().toISOString() : null
      });
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
}

export default staff;