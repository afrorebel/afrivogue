const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = Router();

// GET all settings - public
router.get('/', async (req, res) => {
  try {
    const [settings] = await query('SELECT * FROM site_settings', []);

    const result = {};
    settings.forEach(s => {
      result[s.setting_key] = s.setting_value;
    });

    res.json(result);
  } catch (error) {
    console.error('GET /settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET specific setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [settings] = await query('SELECT * FROM site_settings WHERE setting_key = ?', [key]);

    if (!settings.length) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({
      key: settings[0].setting_key,
      value: settings[0].setting_value
    });
  } catch (error) {
    console.error('GET /settings/:key error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// POST create setting - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { setting_key, setting_value } = req.body;

    if (!setting_key) {
      return res.status(400).json({ error: 'Missing setting_key' });
    }

    const sql = `
      INSERT INTO site_settings (setting_key, setting_value, created_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE setting_value = ?
    `;

    const params = [setting_key, setting_value || null, setting_value || null];

    await query(sql, params);

    res.status(201).json({
      setting_key,
      setting_value
    });
  } catch (error) {
    console.error('POST /settings error:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
});

// PUT update setting by key - admin only (upsert pattern)
router.put('/:key', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const sql = `
      INSERT INTO site_settings (setting_key, setting_value, created_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
    `;

    const params = [key, value || null, value || null];

    await query(sql, params);

    res.json({
      setting_key: key,
      setting_value: value
    });
  } catch (error) {
    console.error('PUT /settings/:key error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

module.exports = router;
