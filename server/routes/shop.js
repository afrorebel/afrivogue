const { Router } = require('express');
const { query } = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { v4: uuidv4 } = require('uuid');

const router = Router();

// ===== PRODUCTS =====

// GET all products - public gets published only
router.get('/products', optionalAuth, async (req, res) => {
  try {
    const { all } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];

    if (!all && (!req.user || !req.user.isAdmin)) {
      sql += ' WHERE published = 1';
    }

    sql += ' ORDER BY created_at DESC';
    const [products] = await query(sql, params);

    res.json(products);
  } catch (error) {
    console.error('GET /products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product
router.get('/products/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let sql = 'SELECT * FROM products WHERE id = ?';
    const params = [id];

    if (!req.user || !req.user.isAdmin) {
      sql += ' AND published = 1';
    }

    const [products] = await query(sql, params);

    if (!products.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('GET /products/:id error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST create product - admin only
router.post('/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      cost,
      sku,
      image_url,
      category_id,
      stock_quantity,
      published = false
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO products (
        id, name, description, price, cost, sku, image_url, category_id,
        stock_quantity, published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      name,
      description || null,
      price,
      cost || null,
      sku || null,
      image_url || null,
      category_id || null,
      stock_quantity || 0,
      published ? 1 : 0
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      name,
      description,
      price,
      cost,
      sku,
      image_url,
      category_id,
      stock_quantity,
      published
    });
  } catch (error) {
    console.error('POST /products error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT update product - admin only
router.put('/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      cost,
      sku,
      image_url,
      category_id,
      stock_quantity,
      published
    } = req.body;

    const [existing] = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Product not found' });
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
    if (price !== undefined) {
      updateFields.push('price = ?');
      params.push(price);
    }
    if (cost !== undefined) {
      updateFields.push('cost = ?');
      params.push(cost);
    }
    if (sku !== undefined) {
      updateFields.push('sku = ?');
      params.push(sku);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      params.push(image_url);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      params.push(category_id);
    }
    if (stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      params.push(stock_quantity);
    }
    if (published !== undefined) {
      updateFields.push('published = ?');
      params.push(published ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /products/:id error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product - admin only
router.delete('/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /products/:id error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ===== CART =====

// GET user's cart
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sql = `
      SELECT ci.*, p.name, p.price, p.image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `;

    const [items] = await query(sql, [userId]);
    res.json(items);
  } catch (error) {
    console.error('GET /cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST add to cart
router.post('/cart', requireAuth, async (req, res) => {
  try {
    const { product_id, quantity, size, color } = req.body;
    const userId = req.user.userId;

    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO cart_items (
        id, user_id, product_id, quantity, size, color, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      userId,
      product_id,
      quantity,
      size || null,
      color || null
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      product_id,
      quantity,
      size,
      color
    });
  } catch (error) {
    console.error('POST /cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT update cart item
router.put('/cart/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    if (quantity === undefined) {
      return res.status(400).json({ error: 'Missing quantity' });
    }

    const [existing] = await query(
      'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);

    const [updated] = await query('SELECT * FROM cart_items WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /cart/:id error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// DELETE cart item
router.delete('/cart/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existing] = await query(
      'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await query('DELETE FROM cart_items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /cart/:id error:', error);
    res.status(500).json({ error: 'Failed to delete cart item' });
  }
});

// ===== ORDERS =====

// GET user's orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const { all } = req.query;
    const userId = req.user.userId;

    let sql = 'SELECT * FROM orders';
    const params = [];

    if (all && req.user.isAdmin) {
      // Admin sees all orders
    } else {
      sql += ' WHERE user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY created_at DESC';
    const [orders] = await query(sql, params);

    res.json(orders);
  } catch (error) {
    console.error('GET /orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST create order
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { items, total, shipping_address } = req.body;
    const userId = req.user.userId;

    if (!items || !total || !shipping_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const itemsJson = JSON.stringify(items);
    const addressJson = JSON.stringify(shipping_address);

    const sql = `
      INSERT INTO orders (
        id, user_id, items, total, shipping_address, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      userId,
      itemsJson,
      total,
      addressJson,
      'pending'
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      total,
      status: 'pending'
    });
  } catch (error) {
    console.error('POST /orders error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT update order status - admin only
router.put('/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }

    const [existing] = await query('SELECT id FROM orders WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    const [updated] = await query('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /orders/:id/status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ===== WISHLISTS =====

// GET user's wishlist
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sql = `
      SELECT p.* FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      WHERE wi.user_id = ?
      ORDER BY wi.created_at DESC
    `;

    const [items] = await query(sql, [userId]);
    res.json(items);
  } catch (error) {
    console.error('GET /wishlist error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST add to wishlist
router.post('/wishlist', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.body;
    const userId = req.user.userId;

    if (!product_id) {
      return res.status(400).json({ error: 'Missing product_id' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO wishlist_items (id, user_id, product_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    await query(sql, [id, userId, product_id]);

    res.status(201).json({ id, product_id });
  } catch (error) {
    console.error('POST /wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE from wishlist
router.delete('/wishlist/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    await query(
      'DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /wishlist/:productId error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// ===== REVIEWS =====

// GET reviews for product
router.get('/reviews/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const sql = `
      SELECT r.*, p.display_name, p.avatar_url
      FROM product_reviews r
      LEFT JOIN profiles p ON r.user_id = p.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `;

    const [reviews] = await query(sql, [productId]);
    res.json(reviews);
  } catch (error) {
    console.error('GET /reviews/:productId error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST create review
router.post('/reviews/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    if (rating === undefined) {
      return res.status(400).json({ error: 'Missing rating' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO product_reviews (
        id, product_id, user_id, rating, comment, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const params = [id, productId, userId, rating, comment || null];

    await query(sql, params);

    res.status(201).json({
      id,
      rating,
      comment,
      user_id: userId
    });
  } catch (error) {
    console.error('POST /reviews/:productId error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// DELETE review
router.delete('/reviews/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existing] = await query(
      'SELECT user_id FROM product_reviews WHERE id = ?',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existing[0].user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await query('DELETE FROM product_reviews WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /reviews/:id error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ===== BUNDLES =====

// GET all bundles - public gets published only
router.get('/bundles', optionalAuth, async (req, res) => {
  try {
    let sql = 'SELECT * FROM product_bundles';
    const params = [];

    if (!req.user || !req.user.isAdmin) {
      sql += ' WHERE published = 1';
    }

    sql += ' ORDER BY created_at DESC';
    const [bundles] = await query(sql, params);

    res.json(bundles);
  } catch (error) {
    console.error('GET /bundles error:', error);
    res.status(500).json({ error: 'Failed to fetch bundles' });
  }
});

// POST create bundle - admin only
router.post('/bundles', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url, published = false } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO product_bundles (
        id, name, description, price, image_url, published, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      name,
      description || null,
      price,
      image_url || null,
      published ? 1 : 0
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      name,
      description,
      price,
      image_url,
      published
    });
  } catch (error) {
    console.error('POST /bundles error:', error);
    res.status(500).json({ error: 'Failed to create bundle' });
  }
});

// PUT update bundle - admin only
router.put('/bundles/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url, published } = req.body;

    const [existing] = await query('SELECT id FROM product_bundles WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Bundle not found' });
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
    if (price !== undefined) {
      updateFields.push('price = ?');
      params.push(price);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url = ?');
      params.push(image_url);
    }
    if (published !== undefined) {
      updateFields.push('published = ?');
      params.push(published ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE product_bundles SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM product_bundles WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /bundles/:id error:', error);
    res.status(500).json({ error: 'Failed to update bundle' });
  }
});

// DELETE bundle - admin only
router.delete('/bundles/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM product_bundles WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    await query('DELETE FROM product_bundles WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /bundles/:id error:', error);
    res.status(500).json({ error: 'Failed to delete bundle' });
  }
});

// POST add product to bundle - admin only
router.post('/bundles/:id/items', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Missing product_id' });
    }

    const bundleItemId = uuidv4();
    const sql = `
      INSERT INTO bundle_items (id, bundle_id, product_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    await query(sql, [bundleItemId, id, product_id]);

    res.status(201).json({ id: bundleItemId, product_id });
  } catch (error) {
    console.error('POST /bundles/:id/items error:', error);
    res.status(500).json({ error: 'Failed to add product to bundle' });
  }
});

// DELETE product from bundle - admin only
router.delete('/bundles/:bundleId/items/:productId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bundleId, productId } = req.params;

    await query(
      'DELETE FROM bundle_items WHERE bundle_id = ? AND product_id = ?',
      [bundleId, productId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /bundles/:bundleId/items/:productId error:', error);
    res.status(500).json({ error: 'Failed to remove product from bundle' });
  }
});

// ===== CROSS-SELL =====

// GET cross-sell recommendations
router.get('/cross-sell/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const sql = `
      SELECT p.* FROM cross_sell_items cs
      JOIN products p ON cs.recommended_product_id = p.id
      WHERE cs.source_product_id = ? AND p.published = 1
    `;

    const [items] = await query(sql, [productId]);
    res.json(items);
  } catch (error) {
    console.error('GET /cross-sell/:productId error:', error);
    res.status(500).json({ error: 'Failed to fetch cross-sell items' });
  }
});

// POST create cross-sell - admin only
router.post('/cross-sell', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { source_product_id, recommended_product_id } = req.body;

    if (!source_product_id || !recommended_product_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO cross_sell_items (
        id, source_product_id, recommended_product_id, created_at
      ) VALUES (?, ?, ?, NOW())
    `;

    await query(sql, [id, source_product_id, recommended_product_id]);

    res.status(201).json({ id, source_product_id, recommended_product_id });
  } catch (error) {
    console.error('POST /cross-sell error:', error);
    res.status(500).json({ error: 'Failed to create cross-sell item' });
  }
});

// DELETE cross-sell - admin only
router.delete('/cross-sell/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM cross_sell_items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /cross-sell/:id error:', error);
    res.status(500).json({ error: 'Failed to delete cross-sell item' });
  }
});

// ===== DISCOUNT CODES =====

// POST validate discount code - public
router.post('/discount/validate', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing code' });
    }

    const [codes] = await query(
      'SELECT * FROM discount_codes WHERE code = ? AND active = 1',
      [code]
    );

    if (!codes.length) {
      return res.status(404).json({ error: 'Invalid code' });
    }

    const discountCode = codes[0];

    // Check expiration
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Code expired' });
    }

    res.json({
      valid: true,
      discount_type: discountCode.discount_type,
      discount_value: discountCode.discount_value,
      max_uses: discountCode.max_uses,
      current_uses: discountCode.current_uses
    });
  } catch (error) {
    console.error('POST /discount/validate error:', error);
    res.status(500).json({ error: 'Failed to validate code' });
  }
});

// GET all discount codes - admin only
router.get('/discount', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [codes] = await query('SELECT * FROM discount_codes ORDER BY created_at DESC', []);
    res.json(codes);
  } catch (error) {
    console.error('GET /discount error:', error);
    res.status(500).json({ error: 'Failed to fetch discount codes' });
  }
});

// POST create discount code - admin only
router.post('/discount', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      max_uses,
      expires_at,
      active = true
    } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const sql = `
      INSERT INTO discount_codes (
        id, code, discount_type, discount_value, max_uses, expires_at, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      id,
      code,
      discount_type,
      discount_value,
      max_uses || null,
      expires_at || null,
      active ? 1 : 0
    ];

    await query(sql, params);

    res.status(201).json({
      id,
      code,
      discount_type,
      discount_value,
      max_uses,
      expires_at,
      active
    });
  } catch (error) {
    console.error('POST /discount error:', error);
    res.status(500).json({ error: 'Failed to create discount code' });
  }
});

// PUT update discount code - admin only
router.put('/discount/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_type,
      discount_value,
      max_uses,
      expires_at,
      active
    } = req.body;

    const [existing] = await query('SELECT id FROM discount_codes WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    const updateFields = [];
    const params = [];

    if (code !== undefined) {
      updateFields.push('code = ?');
      params.push(code);
    }
    if (discount_type !== undefined) {
      updateFields.push('discount_type = ?');
      params.push(discount_type);
    }
    if (discount_value !== undefined) {
      updateFields.push('discount_value = ?');
      params.push(discount_value);
    }
    if (max_uses !== undefined) {
      updateFields.push('max_uses = ?');
      params.push(max_uses);
    }
    if (expires_at !== undefined) {
      updateFields.push('expires_at = ?');
      params.push(expires_at);
    }
    if (active !== undefined) {
      updateFields.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE discount_codes SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [updated] = await query('SELECT * FROM discount_codes WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('PUT /discount/:id error:', error);
    res.status(500).json({ error: 'Failed to update discount code' });
  }
});

// DELETE discount code - admin only
router.delete('/discount/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT id FROM discount_codes WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    await query('DELETE FROM discount_codes WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /discount/:id error:', error);
    res.status(500).json({ error: 'Failed to delete discount code' });
  }
});

module.exports = router;
