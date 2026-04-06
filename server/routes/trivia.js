const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET all trivia questions - public gets published only
router.get('/', optionalAuth, async (req, res) => {
  try {
    let sql = 'SELECT * FROM trivia_questions';
    const params = [];

    if (!req.user || !req.user.isAdmin) {
      sql += ' WHERE published = 1';
    }

    sql += ' ORDER BY created_at DESC';
    const [questions] = await query(sql, params);

    res.json(questions);
  } catch (error) {
    console.error('GET /trivia error:', error);
    res.status(500).json({ error: 'Failed to fetch trivia questions' });
  }
});

// GET single trivia question
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let sql = 'SELECT * FROM trivia_questions WHERE id = ?';
    const params = [id];

    if (!req.user || !req.user.isAdmin) {
      sql += ' AND published = 1';
    }

    const [questions] = await query(sql, params);

    if (!questions.length) {
      return res.status(404).json({ error: 'Trivia question not found' });
    }

    res.json(questions[0]);
  } catch (error) {
    console.error('GET /trivia/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch trivia question' });
  }
});

// POST create trivia question - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      question,
      options,
      correct_answer,
      explanation,
      category,
      difficulty,
      published = false
    } = req.body;

    if (!question || !options || !correct_answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const optionsJson = JSON.stringify(options);

    const sql = `
      INSERT INTO trivia_questions (
        id, question, options, correct_answer, explanation, category,
        difficulty, published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      question,
      optionsJson,
      correct_answer,
      explanation || null,
      category || null,
      difficulty || 'medium',
      published ? 1 : 0
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      question,
      options,
      correct_answer,
      explanation,
      category,
      difficulty,
      published
    });
  } catch (error) {
    console.error('POST /trivia error:', error);
    res.status(500).json({ error: 'Failed to create trivia question' });
  }
});

// PUT update trivia question - admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      question,
      options,
      correct_answer,
      explanation,
      category,
      difficulty,
      published
    } = req.body;

    const [existing] = await query('SELECT id FROM trivia_questions WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Trivia question not found' });
    }

    const updateFields = [];
    const params = [];

    if (question !== undefined) {
      updateFields.push('question = ?');
      params.push(question);
    }
    if (options !== undefined) {
      updateFields.push('options = ?');
      params.push(JSON.stringify(options));
    }
    if (correct_answer !== undefined) {
      updateFields.push('correct_answer = ?');
      params.push(correct_answer);
    }
    if (explanation !== undefined) {
      updateFields.push('explanation = ?');
      params.push(explanation);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      params.push(category);
    }
    if (difficulty !== undefined) {
      updateFields.push('difficulty = ?');
      params.push(difficulty);
    }
    if (published !== undefined) {
      updateFields.push('published = ?');
      params.push(published ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE trivia_questions SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM trivia_questions WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /trivia/:id error:', error);
    res.status(500).json({ error: 'Failed to update trivia question' });
  }
});

// DELETE trivia question - admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM trivia_questions WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Trivia question not found' });
    }

    await query('DELETE FROM trivia_questions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /trivia/:id error:', error);
    res.status(500).json({ error: 'Failed to delete trivia question' });
  }
});

// GET leaderboard - public
router.get('/scores/leaderboard', async (req, res) => {
  try {
    const sql = `
      SELECT u.id, p.display_name, p.avatar_url, SUM(ts.score) as total_score, COUNT(*) as attempts
      FROM trivia_scores ts
      JOIN users u ON ts.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      GROUP BY u.id, p.display_name, p.avatar_url
      ORDER BY total_score DESC
      LIMIT 50
    `;

    const [leaderboard] = await query(sql, []);
    res.json(leaderboard);
  } catch (error) {
    console.error('GET /trivia/scores/leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST submit score - authenticated only
router.post('/scores', requireAuth, async (req, res) => {
  try {
    const { score, total_questions, category } = req.body;
    const userId = req.user.userId;

    if (score === undefined || total_questions === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO trivia_scores (
        id, user_id, score, total_questions, category, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      userId,
      score,
      total_questions,
      category || null
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      score,
      total_questions,
      category
    });
  } catch (error) {
    console.error('POST /trivia/scores error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

module.exports = router;
