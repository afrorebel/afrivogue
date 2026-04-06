const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET comments for trend - public
router.get('/:trendId', optionalAuth, async (req, res) => {
  try {
    const { trendId } = req.params;

    const sql = `
      SELECT c.*, p.display_name, p.avatar_url
      FROM comments c
      LEFT JOIN profiles p ON c.user_id = p.user_id
      WHERE c.trend_id = ?
      ORDER BY c.created_at DESC
    `;

    const [comments] = await query(sql, [trendId]);
    res.json(comments);
  } catch (error) {
    console.error('GET /comments/:trendId error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST create comment - requireAuth
router.post('/:trendId', requireAuth, async (req, res) => {
  try {
    const { trendId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Missing comment content' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO comments (id, trend_id, user_id, content, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const params = [id, trendId, userId, content];

    await query(sql, params);

    res.status(201).json({
      id,
      content,
      user_id: userId
    });
  } catch (error) {
    console.error('POST /comments/:trendId error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// PUT update comment - requireAuth
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }

    const [existing] = await query('SELECT user_id FROM comments WHERE id = ?', [id]);

    if (!existing.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existing[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await query('UPDATE comments SET content = ? WHERE id = ?', [content, id]);

    const [updated] = await query('SELECT * FROM comments WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /comments/:id error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// DELETE comment - requireAuth
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existing] = await query('SELECT user_id FROM comments WHERE id = ?', [id]);

    if (!existing.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existing[0].user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await query('DELETE FROM comments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /comments/:id error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
