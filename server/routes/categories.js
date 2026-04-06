const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// GET all categories - public
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM categories ORDER BY name ASC';
    const [categories] = await query(sql, []);
    res.json(categories);
  } catch (error) {
    console.error('GET /categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [categories] = await query('SELECT * FROM categories WHERE id = ?', [id]);

    if (!categories.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error('GET /categories/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST create category - admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, parent_category_id, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing category name' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO categories (id, name, description, parent_category_id, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      name,
      description || null,
      parent_category_id || null,
      image_url || null
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      name,
      description,
      parent_category_id,
      image_url
    });
  } catch (error) {
    console.error('POST /categories error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT update category - admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_category_id, image_url } = req.body;

    const [existing] = await query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (parent_category_id !== undefined) {
      updateFields.push('parent_category_id = ?');
      params.push(parent_category_id);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      params.push(image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /categories/:id error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category - admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /categories/:id error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
