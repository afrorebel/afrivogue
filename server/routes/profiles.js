const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET own profile - requireAuth
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [profiles] = await query('SELECT * FROM profiles WHERE user_id = ?', [userId]);

    if (!profiles.length) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('GET /profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET any public profile
router.get('/:userId', optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const [profiles] = await query('SELECT * FROM profiles WHERE user_id = ?', [userId]);

    if (!profiles.length) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('GET /profiles/:userId error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT update own profile - requireAuth
router.put('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { display_name, bio, avatar_url } = req.body;

    const updateFields = [];
    const params = [];

    if (display_name !== undefined) {
      updateFields.push('display_name = ?');
      params.push(display_name);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      params.push(bio);
    }
    if (avatar_url !== undefined) {
      updateFields.push('avatar_url = ?');
      params.push(avatar_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);
    const sql = `UPDATE profiles SET ${updateFields.join(', ')} WHERE user_id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /profiles error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET own points - requireAuth
router.get('/points', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [userPoints] = await query('SELECT * FROM user_points WHERE user_id = ?', [userId]);
    const [history] = await query(
      'SELECT * FROM points_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json({
      points: userPoints.length ? userPoints[0] : null,
      history
    });
  } catch (error) {
    console.error('GET /profiles/points error:', error);
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});

// GET saved articles - requireAuth
router.get('/saved-articles', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sql = `
      SELECT t.*, sa.created_at as saved_at
      FROM saved_articles sa
      JOIN trends t ON sa.trend_id = t.id
      WHERE sa.user_id = ?
      ORDER BY sa.created_at DESC
    `;

    const [articles] = await query(sql, [userId]);
    res.json(articles);
  } catch (error) {
    console.error('GET /profiles/saved-articles error:', error);
    res.status(500).json({ error: 'Failed to fetch saved articles' });
  }
});

// POST save article - requireAuth
router.post('/saved-articles', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { trend_id } = req.body;

    if (!trend_id) {
      return res.status(400).json({ error: 'Missing trend_id' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO saved_articles (id, user_id, trend_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    await query(sql, [id, userId, trend_id]);

    res.status(201).json({ id, trend_id });
  } catch (error) {
    console.error('POST /profiles/saved-articles error:', error);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// DELETE saved article - requireAuth
router.delete('/saved-articles/:trendId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { trendId } = req.params;

    await query(
      'DELETE FROM saved_articles WHERE user_id = ? AND trend_id = ?',
      [userId, trendId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /profiles/saved-articles/:trendId error:', error);
    res.status(500).json({ error: 'Failed to unsave article' });
  }
});

// GET reading history - requireAuth
router.get('/reading-history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sql = `
      SELECT t.*, rh.created_at as viewed_at
      FROM reading_history rh
      JOIN trends t ON rh.trend_id = t.id
      WHERE rh.user_id = ?
      ORDER BY rh.created_at DESC
    `;

    const [history] = await query(sql, [userId]);
    res.json(history);
  } catch (error) {
    console.error('GET /profiles/reading-history error:', error);
    res.status(500).json({ error: 'Failed to fetch reading history' });
  }
});

// POST record view - requireAuth
router.post('/reading-history', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { trend_id } = req.body;

    if (!trend_id) {
      return res.status(400).json({ error: 'Missing trend_id' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO reading_history (id, user_id, trend_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    await query(sql, [id, userId, trend_id]);

    res.status(201).json({ id, trend_id });
  } catch (error) {
    console.error('POST /profiles/reading-history error:', error);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// GET user preferences - requireAuth
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [prefs] = await query('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);

    if (!prefs.length) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    res.json(prefs[0]);
  } catch (error) {
    console.error('GET /profiles/preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// PUT update preferences - requireAuth
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { categories } = req.body;

    const categoriesJson = categories ? JSON.stringify(categories) : null;

    const sql = `
      INSERT INTO user_preferences (user_id, categories, updated_at)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE categories = ?, updated_at = NOW()
    `;

    const params = [userId, categoriesJson, categoriesJson];

    await query(sql, params);

    res.json({ categories });
  } catch (error) {
    console.error('PUT /profiles/preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// GET own submissions - requireAuth
router.get('/submissions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [submissions] = await query(
      'SELECT * FROM article_submissions WHERE submitted_by = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(submissions);
  } catch (error) {
    console.error('GET /profiles/submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// GET own withdrawals - requireAuth
router.get('/withdrawals', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [withdrawals] = await query(
      'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(withdrawals);
  } catch (error) {
    console.error('GET /profiles/withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// POST request withdrawal - requireAuth
router.post('/withdrawals', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { points_amount, dollar_amount } = req.body;

    if (points_amount === undefined || dollar_amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO withdrawals (
        id, user_id, points_amount, dollar_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      userId,
      points_amount,
      dollar_amount,
      'pending'
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      points_amount,
      dollar_amount,
      status: 'pending'
    });
  } catch (error) {
    console.error('POST /profiles/withdrawals error:', error);
    res.status(500).json({ error: 'Failed to request withdrawal' });
  }
});

module.exports = router;
