const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();

/**
 * GET /api/trends
 * Get all trends (with filtering)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      published = 'true',
      limit = 100,
      offset = 0,
      needs_review
    } = req.query;

    const isAdmin = req.user && req.user.roles && req.user.roles.includes('admin');

    let query = 'SELECT * FROM trends';
    const params = [];
    const conditions = [];

    // Filter by published status for non-admins
    if (!isAdmin && published === 'true') {
      conditions.push('published = true');
    }

    // Filter by needs_review for admins only
    if (isAdmin && needs_review === 'true') {
      conditions.push('needs_review = true');
    }

    // Filter by category if provided
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    params.push(parseInt(limit) || 100);
    query += ` LIMIT $${params.length}`;

    params.push(parseInt(offset) || 0);
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/trends/:id
 * Get a single trend by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user && req.user.roles && req.user.roles.includes('admin');

    let query = 'SELECT * FROM trends WHERE id = $1';

    // If not admin, only return published trends
    if (!isAdmin) {
      query += ' AND published = true';
    }

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trend not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trends
 * Create a new trend (admin only)
 */
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const trendData = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    // Build dynamic insert based on provided fields
    const fields = ['id', 'created_at', 'updated_at'];
    const values = [id, now, now];
    const placeholders = ['$1', '$2', '$3'];

    // Add all provided fields from request body
    let paramIndex = 4;
    for (const [key, value] of Object.entries(trendData)) {
      if (value !== undefined && value !== null) {
        fields.push(key);
        values.push(value);
        placeholders.push(`$${paramIndex}`);
        paramIndex++;
      }
    }

    const query = `INSERT INTO trends (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

    const result = await db.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/trends/:id
 * Update a trend (admin only)
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if trend exists
    const existsResult = await db.query('SELECT id FROM trends WHERE id = $1', [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trend not found' });
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // Always update the updated_at timestamp
    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      // Only updated_at would be updated, return the existing trend
      return res.json(existsResult.rows[0]);
    }

    values.push(id);
    const query = `UPDATE trends SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/trends/:id
 * Delete a trend (admin only)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM trends WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trend not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trends/ingest
 * Stub for AI-powered trend ingestion (not available in self-hosted mode)
 */
router.post('/ingest', requireAuth, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'AI ingestion not available in self-hosted mode. Add trends manually.'
  });
});

module.exports = router;
