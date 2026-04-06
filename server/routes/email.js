'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const emailService = require('../services/email');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

/**
 * POST /send
 * Send an email via a template (requires auth + admin OR internal service call)
 */
router.post('/send', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { templateName, recipientEmail, templateData = {} } = req.body;

    if (!templateName || !recipientEmail) {
      return res.status(400).json({ error: 'templateName and recipientEmail are required' });
    }

    // Send template
    const result = await emailService.sendTemplate(templateName, recipientEmail, templateData);

    // Log the email send
    await db.query(
      'INSERT INTO email_send_log (id, recipient_email, template_name, status, message_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [uuidv4(), recipientEmail, templateName, 'sent', result.messageId || null]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);

    // Log failed attempt
    const { templateName, recipientEmail } = req.body;
    await db.query(
      'INSERT INTO email_send_log (id, recipient_email, template_name, status, error_message, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [uuidv4(), recipientEmail, templateName, 'failed', error.message]
    );

    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * POST /unsubscribe
 * Unsubscribe from newsletters (public endpoint)
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token && !email) {
      return res.status(400).json({ error: 'token or email is required' });
    }

    let emailToUnsubscribe = email;

    // If token is provided, look up the email
    if (token) {
      const [tokenRows] = await db.query(
        'SELECT email FROM email_unsubscribe_tokens WHERE token = ?',
        [token]
      );

      if (tokenRows.length === 0) {
        return res.status(404).json({ error: 'Invalid or expired unsubscribe token' });
      }

      emailToUnsubscribe = tokenRows[0].email;
    }

    // Add to suppressed_emails if not already there
    await db.query(
      'INSERT IGNORE INTO suppressed_emails (id, email, reason, created_at) VALUES (?, ?, ?, NOW())',
      [uuidv4(), emailToUnsubscribe, 'user_unsubscribe']
    );

    // Update newsletter_subscribers status
    await db.query(
      'UPDATE newsletter_subscribers SET is_subscribed = 0, unsubscribed_at = NOW() WHERE email = ?',
      [emailToUnsubscribe]
    );

    res.json({ success: true, message: 'You have been unsubscribed.' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * GET /log
 * Get email send log with pagination (admin only)
 */
router.get('/log', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await db.query(
      'SELECT * FROM email_send_log ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM email_send_log');
    const total = countResult[0].total;

    res.json({ logs, total });
  } catch (error) {
    console.error('Error fetching email log:', error);
    res.status(500).json({ error: 'Failed to fetch email log' });
  }
});

/**
 * POST /suppress
 * Add an email to the suppression list (admin only)
 */
router.post('/suppress', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    await db.query(
      'INSERT IGNORE INTO suppressed_emails (id, email, reason, created_at) VALUES (?, ?, ?, NOW())',
      [uuidv4(), email, reason || null]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error suppressing email:', error);
    res.status(500).json({ error: 'Failed to suppress email' });
  }
});

/**
 * DELETE /suppress/:email
 * Remove an email from the suppression list (admin only)
 */
router.delete('/suppress/:email', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    await db.query('DELETE FROM suppressed_emails WHERE email = ?', [email]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing email from suppression:', error);
    res.status(500).json({ error: 'Failed to remove email from suppression' });
  }
});

/**
 * GET /suppress
 * List all suppressed emails (admin only)
 */
router.get('/suppress', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [suppressed] = await db.query('SELECT email, reason, created_at FROM suppressed_emails ORDER BY created_at DESC');

    res.json(suppressed);
  } catch (error) {
    console.error('Error fetching suppressed emails:', error);
    res.status(500).json({ error: 'Failed to fetch suppressed emails' });
  }
});

/**
 * POST /test
 * Send a test email (admin only)
 */
router.post('/test', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { templateName, recipientEmail, templateData = {} } = req.body;

    if (!templateName || !recipientEmail) {
      return res.status(400).json({ error: 'templateName and recipientEmail are required' });
    }

    const result = await emailService.sendTemplate(templateName, recipientEmail, templateData);

    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

module.exports = router;
