const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET stats - admin only
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Total users
    const [userCount] = await query('SELECT COUNT(*) as count FROM profiles', []);

    // Total published trends
    const [trendCount] = await query('SELECT COUNT(*) as count FROM trends WHERE published = 1', []);

    // Total orders and revenue
    const [orderStats] = await query(
      'SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status = ?',
      ['paid']
    );

    // Newsletter subscribers
    const [subscriberCount] = await query(
      'SELECT COUNT(*) as count FROM newsletter_subscribers WHERE status = ?',
      ['subscribed']
    );

    // Published trivia questions
    const [triviaCount] = await query(
      'SELECT COUNT(*) as count FROM trivia_questions WHERE published = 1',
      []
    );

    // Recent signups (last 30 days)
    const [recentSignups] = await query(
      'SELECT COUNT(*) as count FROM profiles WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      []
    );

    // Monthly revenue
    const [monthlyRevenue] = await query(`
      SELECT DATE_TRUNC(created_at, MONTH) as month, SUM(total) as revenue
      FROM orders
      WHERE status = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_TRUNC(created_at, MONTH)
      ORDER BY month ASC
    `, ['paid']);

    res.json({
      totalUsers: userCount[0].count,
      totalTrends: trendCount[0].count,
      totalOrders: orderStats[0].count,
      totalRevenue: orderStats[0].revenue || 0,
      newsletterSubscribers: subscriberCount[0].count,
      triviaQuestions: triviaCount[0].count,
      recentSignups: recentSignups[0].count,
      monthlyRevenue: monthlyRevenue || []
    });
  } catch (error) {
    console.error('GET /admin/stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET users - admin only
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const sql = `
      SELECT p.*, u.email, GROUP_CONCAT(ur.role) as roles
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY p.user_id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [users] = await query(sql, [parseInt(limit), parseInt(offset)]);

    const [count] = await query('SELECT COUNT(*) as total FROM profiles', []);

    res.json({
      users,
      total: count[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('GET /admin/users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT update user - admin only
router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_premium } = req.body;

    if (is_premium === undefined) {
      return res.status(400).json({ error: 'Missing is_premium field' });
    }

    // Update via site_settings for manual premium
    await query(
      'INSERT INTO site_settings (setting_key, setting_value, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?',
      [`user_${id}_manual_premium`, is_premium ? '1' : '0', is_premium ? '1' : '0']
    );

    res.json({ success: true, is_premium });
  } catch (error) {
    console.error('PUT /admin/users/:id error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// GET CRM data - admin only
router.get('/crm', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT ci.*, u.email, p.display_name, pr.name as product_name
      FROM cart_items ci
      JOIN profiles p ON ci.user_id = p.user_id
      JOIN users u ON p.user_id = u.id
      JOIN products pr ON ci.product_id = pr.id
      WHERE ci.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY ci.created_at DESC
    `;

    const [cartItems] = await query(sql, []);
    res.json(cartItems);
  } catch (error) {
    console.error('GET /admin/crm error:', error);
    res.status(500).json({ error: 'Failed to fetch CRM data' });
  }
});

// POST log CRM email action - admin only
router.post('/crm/email-log', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_id, email_type, subject, status = 'sent' } = req.body;

    if (!user_id || !email_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO crm_email_log (id, user_id, email_type, subject, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [id, user_id, email_type, subject || null, status];

    await query(sql, params);

    res.status(201).json({
      id,
      user_id,
      email_type,
      subject,
      status
    });
  } catch (error) {
    console.error('POST /admin/crm/email-log error:', error);
    res.status(500).json({ error: 'Failed to log email' });
  }
});

// GET CRM email log - admin only
router.get('/crm/email-log', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, user_id } = req.query;

    let sql = 'SELECT * FROM crm_email_log';
    const params = [];

    if (user_id) {
      sql += ' WHERE user_id = ?';
      params.push(user_id);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const [logs] = await query(sql, params);
    res.json(logs);
  } catch (error) {
    console.error('GET /admin/crm/email-log error:', error);
    res.status(500).json({ error: 'Failed to fetch email log' });
  }
});

module.exports = router;
