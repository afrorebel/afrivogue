const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET all forecasts - public gets published only
router.get('/', optionalAuth, async (req, res) => {
  try {
    let sql = 'SELECT * FROM forecasts';
    const params = [];

    if (!req.user || !req.user.isAdmin) {
      sql += ' WHERE published = 1';
    }

    sql += ' ORDER BY published_date DESC, created_at DESC';
    const [forecasts] = await query(sql, params);

    res.json(forecasts);
  } catch (error) {
    console.error('GET /forecasts error:', error);
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

// GET single forecast
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let sql = 'SELECT * FROM forecasts WHERE id = ?';
    const params = [id];

    if (!req.user || !req.user.isAdmin) {
      sql += ' AND published = 1';
    }

    const [forecasts] = await query(sql, params);

    if (!forecasts.length) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    res.json(forecasts[0]);
  } catch (error) {
    console.error('GET /forecasts/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

// POST create forecast - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      projection,
      evidence,
      implications,
      domain,
      horizon,
      signal_strength,
      region,
      published = false
    } = req.body;

    if (!title || !projection) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const published_date = published ? new Date() : null;

    const sql = `
      INSERT INTO forecasts (
        id, title, projection, evidence, implications, domain, horizon,
        signal_strength, region, published, published_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      title,
      projection,
      evidence || null,
      implications || null,
      domain || null,
      horizon || null,
      signal_strength || null,
      region || null,
      published ? 1 : 0,
      published_date
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      title,
      projection,
      evidence,
      implications,
      domain,
      horizon,
      signal_strength,
      region,
      published,
      published_date
    });
  } catch (error) {
    console.error('POST /forecasts error:', error);
    res.status(500).json({ error: 'Failed to create forecast' });
  }
});

// PUT update forecast - admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      projection,
      evidence,
      implications,
      domain,
      horizon,
      signal_strength,
      region,
      published
    } = req.body;

    // Check if exists
    const [existing] = await query('SELECT id FROM forecasts WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (projection !== undefined) {
      updateFields.push('projection = ?');
      params.push(projection);
    }
    if (evidence !== undefined) {
      updateFields.push('evidence = ?');
      params.push(evidence);
    }
    if (implications !== undefined) {
      updateFields.push('implications = ?');
      params.push(implications);
    }
    if (domain !== undefined) {
      updateFields.push('domain = ?');
      params.push(domain);
    }
    if (horizon !== undefined) {
      updateFields.push('horizon = ?');
      params.push(horizon);
    }
    if (signal_strength !== undefined) {
      updateFields.push('signal_strength = ?');
      params.push(signal_strength);
    }
    if (region !== undefined) {
      updateFields.push('region = ?');
      params.push(region);
    }
    if (published !== undefined) {
      updateFields.push('published = ?');
      params.push(published ? 1 : 0);
      if (published && !existing[0].published) {
        updateFields.push('published_date = NOW()');
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE forecasts SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM forecasts WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /forecasts/:id error:', error);
    res.status(500).json({ error: 'Failed to update forecast' });
  }
});

// DELETE forecast - admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM forecasts WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Forecast not found' });
    }

    await query('DELETE FROM forecasts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /forecasts/:id error:', error);
    res.status(500).json({ error: 'Failed to delete forecast' });
  }
});

// POST ingest stub - admin only
router.post('/ingest/batch', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { forecasts: forecastList } = req.body;

    if (!Array.isArray(forecastList) || forecastList.length === 0) {
      return res.status(400).json({ error: 'Invalid forecasts array' });
    }

    const results = [];

    for (const forecast of forecastList) {
      const {
        title,
        projection,
        evidence,
        implications,
        domain,
        horizon,
        signal_strength,
        region,
        published = false
      } = forecast;

      if (!title || !projection) continue;

      const id = uuidv4();
      const published_date = published ? new Date() : null;

      const sql = `
        INSERT INTO forecasts (
          id, title, projection, evidence, implications, domain, horizon,
          signal_strength, region, published, published_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const params = [
        id,
        title,
        projection,
        evidence || null,
        implications || null,
        domain || null,
        horizon || null,
        signal_strength || null,
        region || null,
        published ? 1 : 0,
        published_date
      ];

      await query(sql, params);
      results.push(id);
    }

    res.status(201).json({
      success: true,
      ingested: results.length,
      ids: results
    });
  } catch (error) {
    console.error('POST /forecasts/ingest/batch error:', error);
    res.status(500).json({ error: 'Failed to ingest forecasts' });
  }
});

module.exports = router;
