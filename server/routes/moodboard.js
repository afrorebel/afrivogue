const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET all moodboard items - public gets approved only
router.get('/', optionalAuth, async (req, res) => {
  try {
    let sql = 'SELECT * FROM moodboard_items';
    const params = [];

    if (!req.user || !req.user.isAdmin) {
      sql += ' WHERE approved = 1';
    }

    sql += ' ORDER BY created_at DESC';
    const [items] = await query(sql, params);

    res.json(items);
  } catch (error) {
    console.error('GET /moodboard error:', error);
    res.status(500).json({ error: 'Failed to fetch moodboard items' });
  }
});

// GET single moodboard item
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let sql = 'SELECT * FROM moodboard_items WHERE id = ?';
    const params = [id];

    if (!req.user || !req.user.isAdmin) {
      sql += ' AND approved = 1';
    }

    const [items] = await query(sql, params);

    if (!items.length) {
      return res.status(404).json({ error: 'Moodboard item not found' });
    }

    res.json(items[0]);
  } catch (error) {
    console.error('GET /moodboard/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch moodboard item' });
  }
});

// POST create moodboard item - authenticated users
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      image_url,
      caption,
      category,
      related_trend_id,
      source_url,
      needs_review = false
    } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Missing image_url' });
    }

    const id = uuidv4();
    const userId = req.user.userId;

    const sql = `
      INSERT INTO moodboard_items (
        id, image_url, caption, category, related_trend_id, source_url,
        submitted_by, approved, needs_review, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      image_url,
      caption || null,
      category || null,
      related_trend_id || null,
      source_url || null,
      userId,
      0,
      needs_review ? 1 : 0
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      image_url,
      caption,
      category,
      related_trend_id,
      source_url,
      submitted_by: userId,
      approved: 0,
      needs_review
    });
  } catch (error) {
    console.error('POST /moodboard error:', error);
    res.status(500).json({ error: 'Failed to create moodboard item' });
  }
});

// PUT update moodboard item - admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      image_url,
      caption,
      category,
      related_trend_id,
      source_url,
      needs_review,
      approved
    } = req.body;

    const [existing] = await query('SELECT id FROM moodboard_items WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Moodboard item not found' });
    }

    const updateFields = [];
    const params = [];

    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      params.push(image_url);
    }
    if (caption !== undefined) {
      updateFields.push('caption = ?');
      params.push(caption);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      params.push(category);
    }
    if (related_trend_id !== undefined) {
      updateFields.push('related_trend_id = ?');
      params.push(related_trend_id);
    }
    if (source_url !== undefined) {
      updateFields.push('source_url = ?');
      params.push(source_url);
    }
    if (needs_review !== undefined) {
      updateFields.push('needs_review = ?');
      params.push(needs_review ? 1 : 0);
    }
    if (approved !== undefined) {
      updateFields.push('approved = ?');
      params.push(approved ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE moodboard_items SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM moodboard_items WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /moodboard/:id error:', error);
    res.status(500).json({ error: 'Failed to update moodboard item' });
  }
});

// DELETE moodboard item - admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM moodboard_items WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Moodboard item not found' });
    }

    await query('DELETE FROM moodboard_items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /moodboard/:id error:', error);
    res.status(500).json({ error: 'Failed to delete moodboard item' });
  }
});

module.exports = router;
