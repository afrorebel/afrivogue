const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const router = Router();

// ===== SUBSCRIBERS =====

// POST subscribe - public
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // Check if already subscribed
    const [existing] = await query(
      'SELECT id FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (existing.length) {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    const id = uuidv4();
    const unsubscribe_token = crypto.randomBytes(32).toString('hex');

    const sql = `
      INSERT INTO newsletter_subscribers (
        id, email, name, unsubscribe_token, status, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [id, email, name || null, unsubscribe_token, 'subscribed'];

    await query(sql, params);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('POST /newsletter/subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// GET subscribers - admin only
router.get('/subscribers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const [subscribers] = await query(
      'SELECT * FROM newsletter_subscribers WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      ['subscribed', parseInt(limit), parseInt(offset)]
    );

    const [count] = await query(
      'SELECT COUNT(*) as total FROM newsletter_subscribers WHERE status = ?',
      ['subscribed']
    );

    res.json({
      subscribers,
      total: count[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('GET /newsletter/subscribers error:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// DELETE subscriber - admin only
router.delete('/subscribers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM newsletter_subscribers WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    await query('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /newsletter/subscribers/:id error:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

// GET subscribers export CSV - admin only
router.get('/subscribers/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [subscribers] = await query(
      'SELECT email, name FROM newsletter_subscribers WHERE status = ? ORDER BY created_at DESC',
      ['subscribed']
    );

    let csv = 'email,name\n';
    subscribers.forEach(s => {
      const name = s.name ? `"${s.name.replace(/"/g, '""')}"` : '';
      csv += `${s.email},${name}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subscribers.csv"');
    res.send(csv);
  } catch (error) {
    console.error('GET /newsletter/subscribers/export error:', error);
    res.status(500).json({ error: 'Failed to export subscribers' });
  }
});

// POST unsubscribe - public
router.post('/unsubscribe', async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token && !email) {
      return res.status(400).json({ error: 'Missing token or email' });
    }

    let sql;
    let params;

    if (token) {
      sql = 'UPDATE newsletter_subscribers SET status = ? WHERE unsubscribe_token = ?';
      params = ['unsubscribed', token];
    } else {
      sql = 'UPDATE newsletter_subscribers SET status = ? WHERE email = ?';
      params = ['unsubscribed', email];
    }

    await query(sql, params);

    res.json({ success: true });
  } catch (error) {
    console.error('POST /newsletter/unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// ===== CAMPAIGNS =====

// GET all campaigns - admin only
router.get('/campaigns', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [campaigns] = await query(
      'SELECT * FROM newsletter_campaigns ORDER BY created_at DESC',
      []
    );

    res.json(campaigns);
  } catch (error) {
    console.error('GET /newsletter/campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET single campaign - admin only
router.get('/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [campaigns] = await query(
      'SELECT * FROM newsletter_campaigns WHERE id = ?',
      [id]
    );

    if (!campaigns.length) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaigns[0];

    // Get send stats
    const [stats] = await query(
      'SELECT COUNT(*) as sent_count FROM newsletter_sends WHERE campaign_id = ?',
      [id]
    );

    res.json({
      ...campaign,
      sent_count: stats[0].sent_count
    });
  } catch (error) {
    console.error('GET /newsletter/campaigns/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST create campaign - admin only
router.post('/campaigns', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { subject, body_html, scheduled_at } = req.body;

    if (!subject || !body_html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO newsletter_campaigns (
        id, subject, body_html, scheduled_at, status, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      subject,
      body_html,
      scheduled_at || null,
      'draft'
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      subject,
      status: 'draft'
    });
  } catch (error) {
    console.error('POST /newsletter/campaigns error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT update campaign - admin only
router.put('/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body_html, scheduled_at } = req.body;

    const [existing] = await query('SELECT id FROM newsletter_campaigns WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const updateFields = [];
    const params = [];

    if (subject !== undefined) {
      updateFields.push('subject = ?');
      params.push(subject);
    }
    if (body_html !== undefined) {
      updateFields.push('body_html = ?');
      params.push(body_html);
    }
    if (scheduled_at !== undefined) {
      updateFields.push('scheduled_at = ?');
      params.push(scheduled_at);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE newsletter_campaigns SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM newsletter_campaigns WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /newsletter/campaigns/:id error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE campaign - admin only
router.delete('/campaigns/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT status FROM newsletter_campaigns WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (existing[0].status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft campaigns' });
    }

    await query('DELETE FROM newsletter_campaigns WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /newsletter/campaigns/:id error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// POST send campaign - admin only
router.post('/campaigns/:id/send', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [campaigns] = await query('SELECT * FROM newsletter_campaigns WHERE id = ?', [id]);
    if (!campaigns.length) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update campaign status
    await query('UPDATE newsletter_campaigns SET status = ?, sent_at = NOW() WHERE id = ?', [
      'sending',
      id
    ]);

    // Get all active subscribers
    const [subscribers] = await query(
      'SELECT id FROM newsletter_subscribers WHERE status = ?',
      ['subscribed']
    );

    // Queue sends
    const sendPromises = subscribers.map(subscriber => {
      const sendId = uuidv4();
      return query(
        'INSERT INTO newsletter_sends (id, campaign_id, subscriber_id, created_at) VALUES (?, ?, ?, NOW())',
        [sendId, id, subscriber.id]
      );
    });

    await Promise.all(sendPromises);

    res.json({
      success: true,
      recipient_count: subscribers.length
    });
  } catch (error) {
    console.error('POST /newsletter/campaigns/:id/send error:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

module.exports = router;
