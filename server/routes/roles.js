const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET all user roles - admin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT ur.*, u.email
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      ORDER BY ur.created_at DESC
    `;

    const [roles] = await query(sql, []);
    res.json(roles);
  } catch (error) {
    console.error('GET /roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST assign role - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO user_roles (id, user_id, role, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    const params = [id, user_id, role];

    await query(sql, params);

    res.status(201).json({
      id,
      user_id,
      role
    });
  } catch (error) {
    console.error('POST /roles error:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
});

// DELETE role - admin only
router.delete('/:userId/:role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.params;

    const [existing] = await query(
      'SELECT id FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, role]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Role assignment not found' });
    }

    await query(
      'DELETE FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, role]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /roles/:userId/:role error:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

// GET check admin role - requireAuth
router.get('/check', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [roles] = await query(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
      [userId, 'admin']
    );

    res.json({
      isAdmin: roles.length > 0
    });
  } catch (error) {
    console.error('GET /roles/check error:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

module.exports = router;
