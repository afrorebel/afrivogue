const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();

/**
 * GET /api/editorials
 * Get all editorials (published for public, all for admins)
 */
router.get('/', async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.roles && req.user.roles.includes('admin');

    let query = `SELECT
                   s.id, s.title, s.content, s.status, s.user_id, s.created_at, s.updated_at,
                   p.display_name as author_name, p.avatar_url as author_avatar
                 FROM article_submissions s
                 LEFT JOIN profiles p ON s.user_id = p.user_id`;

    // Filter by status for non-admins
    if (!isAdmin) {
      query += " WHERE s.status = 'published'";
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await db.query(query);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/editorials/:id
 * Get a single editorial by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user && req.user.roles && req.user.roles.includes('admin');

    let query = `SELECT
                   s.id, s.title, s.content, s.status, s.user_id, s.created_at, s.updated_at,
                   p.display_name as author_name, p.avatar_url as author_avatar
                 FROM article_submissions s
                 LEFT JOIN profiles p ON s.user_id = p.user_id
                 WHERE s.id = $1`;

    // If not admin, only return published articles
    if (!isAdmin) {
      query += " AND s.status = 'published'";
    }

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editorial not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/editorials
 * Create a new editorial (admin only)
 */
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { title, content, ...otherFields } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const userId = req.user.userId;

    // Build dynamic insert
    const fields = ['id', 'user_id', 'status', 'created_at', 'updated_at'];
    const values = [id, userId, 'draft', now, now];
    const placeholders = ['$1', '$2', '$3', '$4', '$5'];

    // Add title and content if provided
    if (title !== undefined) {
      fields.push('title');
      values.push(title);
      placeholders.push(`$${values.length}`);
    }

    if (content !== undefined) {
      fields.push('content');
      values.push(content);
      placeholders.push(`$${values.length}`);
    }

    // Add any other provided fields
    let paramIndex = values.length + 1;
    for (const [key, value] of Object.entries(otherFields)) {
      if (value !== undefined && value !== null && key !== 'status') {
        fields.push(key);
        values.push(value);
        placeholders.push(`$${paramIndex}`);
        paramIndex++;
      }
    }

    const query = `INSERT INTO article_submissions (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

    const result = await db.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/editorials/:id
 * Update an editorial (admin only)
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if article exists
    const existsResult = await db.query(
      'SELECT * FROM article_submissions WHERE id = $1',
      [id]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Editorial not found' });
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // Always update the updated_at timestamp
    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      // Only updated_at would be updated, return the existing article with current data
      const existing = existsResult.rows[0];
      const response = {
        ...existing,
        updated_at: new Date().toISOString()
      };
      return res.json(response);
    }

    values.push(id);
    const query = `UPDATE article_submissions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/editorials/:id
 * Delete an editorial (admin only)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM article_submissions WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editorial not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
