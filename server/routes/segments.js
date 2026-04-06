const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET all segments - admin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [segments] = await query('SELECT * FROM customer_segments ORDER BY created_at DESC', []);
    res.json(segments);
  } catch (error) {
    console.error('GET /segments error:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// POST create segment - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, criteria } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing segment name' });
    }

    const id = uuidv4();
    const criteriaJson = criteria ? JSON.stringify(criteria) : null;

    const sql = `
      INSERT INTO customer_segments (id, name, description, criteria, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const params = [id, name, description || null, criteriaJson];

    await query(sql, params);

    res.status(201).json({
      id,
      name,
      description,
      criteria
    });
  } catch (error) {
    console.error('POST /segments error:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

// PUT update segment - admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, criteria } = req.body;

    const [existing] = await query('SELECT id FROM customer_segments WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (criteria !== undefined) {
      updateFields.push('criteria = ?');
      params.push(criteria ? JSON.stringify(criteria) : null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE customer_segments SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM customer_segments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /segments/:id error:', error);
    res.status(500).json({ error: 'Failed to update segment' });
  }
});

// DELETE segment - admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM customer_segments WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    await query('DELETE FROM customer_segments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /segments/:id error:', error);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
});

// GET segment members - admin only
router.get('/:id/members', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT p.* FROM segment_members sm
      JOIN profiles p ON sm.user_id = p.user_id
      WHERE sm.segment_id = ?
      ORDER BY sm.created_at DESC
    `;

    const [members] = await query(sql, [id]);
    res.json(members);
  } catch (error) {
    console.error('GET /segments/:id/members error:', error);
    res.status(500).json({ error: 'Failed to fetch segment members' });
  }
});

// POST add user to segment - admin only
router.post('/:id/members', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id' });
    }

    const memberId = uuidv4();
    const sql = `
      INSERT INTO segment_members (id, segment_id, user_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    await query(sql, [memberId, id, user_id]);

    res.status(201).json({ id: memberId, user_id });
  } catch (error) {
    console.error('POST /segments/:id/members error:', error);
    res.status(500).json({ error: 'Failed to add user to segment' });
  }
});

// DELETE user from segment - admin only
router.delete('/:id/members/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, userId } = req.params;

    await query(
      'DELETE FROM segment_members WHERE segment_id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /segments/:id/members/:userId error:', error);
    res.status(500).json({ error: 'Failed to remove user from segment' });
  }
});

module.exports = router;
