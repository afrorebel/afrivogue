/**
 * Generic REST Table Router
 *
 * Provides direct CRUD access to allowlisted MySQL tables.
 * Mounted LAST in index.js so all named routes (shop, profiles, etc.) take priority.
 *
 * GET    /api/:table          → SELECT with query-param filters
 * GET    /api/:table/:id      → SELECT single row by id
 * POST   /api/:table          → INSERT (or UPSERT when body._upsert === true)
 * PUT    /api/:table/:id      → UPDATE row by id
 * DELETE /api/:table/:id      → DELETE row by id
 *
 * Supported query params for GET:
 *   col=val               eq filter
 *   col__gte=val          >=
 *   col__lte=val          <=
 *   col__neq=val          !=
 *   col__like=val         LIKE
 *   select=col1,col2      column whitelist (use * for all)
 *   orderBy=col           sort column
 *   ascending=true|false  sort direction (default true)
 *   limit=n               row limit
 *   offset=n              row offset
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

// Only allow safe SQL identifiers (a-z, 0-9, underscore, must start with letter/underscore)
const SAFE_ID_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const isSafe = (s) => typeof s === 'string' && SAFE_ID_RE.test(s) && s.length <= 64;

// ─── Table access configuration ───────────────────────────────────────────────
// read:  'public' | 'auth' | 'admin'
// write: 'public' | 'auth' | 'admin'
// userOwned: true  → read/write auto-filtered by user_id = req.user.userId
// publicFilter: { col: val }  → applied to public (non-admin) GET requests
const TABLE_CONFIG = {
  // ── Publicly readable ────────────────────────────────────────────────────
  categories:             { read: 'public', write: 'admin' },
  site_settings:          { read: 'public', write: 'admin' },
  trends:                 { read: 'public', write: 'admin',
                            publicFilter: { published: 1 } },
  forecasts:              { read: 'public', write: 'admin',
                            publicFilter: { published: 1 } },
  moodboard_items:        { read: 'public', write: 'auth',
                            publicFilter: { status: 'approved' } },
  trivia_questions:       { read: 'public', write: 'admin' },
  products:               { read: 'public', write: 'admin',
                            publicFilter: { is_active: 1 } },
  product_bundles:        { read: 'public', write: 'admin',
                            publicFilter: { is_active: 1 } },
  comments:               { read: 'public', write: 'auth',
                            publicFilter: { status: 'approved' } },
  article_submissions:    { read: 'public', write: 'auth',
                            publicFilter: { status: 'published' } },
  profiles:               { read: 'public', write: 'auth' },
  trivia_scores:          { read: 'public', write: 'auth' },

  // ── Auth required (user sees/writes own data) ────────────────────────────
  cart_items:             { read: 'auth', write: 'auth', userOwned: true },
  orders:                 { read: 'auth', write: 'auth', userOwned: true },
  wishlists:              { read: 'auth', write: 'auth', userOwned: true },
  product_reviews:        { read: 'auth', write: 'auth', userOwned: true },
  saved_articles:         { read: 'auth', write: 'auth', userOwned: true },
  reading_history:        { read: 'auth', write: 'auth', userOwned: true },
  saved_moodboard_items:  { read: 'auth', write: 'auth', userOwned: true },
  user_points:            { read: 'auth', write: 'auth', userOwned: true },
  points_history:         { read: 'auth', write: 'auth', userOwned: true },
  user_preferences:       { read: 'auth', write: 'auth', userOwned: true },
  withdrawals:            { read: 'auth', write: 'auth', userOwned: true },
  favorite_authors:       { read: 'auth', write: 'auth', userOwned: true },
  newsletter_subscribers: { read: 'auth', write: 'public' },

  // ── Admin only ────────────────────────────────────────────────────────────
  segment_members:        { read: 'admin', write: 'admin' },
  customer_segments:      { read: 'admin', write: 'admin' },
  bundle_items:           { read: 'admin', write: 'admin' },
  cross_sell_rules:       { read: 'admin', write: 'admin' },
  discount_codes:         { read: 'admin', write: 'admin' },
  user_roles:             { read: 'admin', write: 'admin' },
};

// Reserved query-param names — not treated as column filters
const RESERVED_PARAMS = new Set(['select', 'orderBy', 'ascending', 'limit', 'offset']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check whether the requesting user passes the required access level.
 */
function checkAccess(level, req) {
  const isAdmin = req.user?.roles?.includes('admin');
  if (level === 'public') return true;
  if (level === 'auth')   return !!req.user;
  if (level === 'admin')  return isAdmin;
  return false;
}

/**
 * Build WHERE clause conditions + params from query parameters.
 * Also applies publicFilter and userOwned constraints.
 */
function buildWhere(query, config, req) {
  const conditions = [];
  const params = [];
  const isAdmin = req.user?.roles?.includes('admin');
  const userId  = req.user?.userId;

  // Public filter (e.g. published=1, status='approved') — skipped for admins
  if (!isAdmin && config.publicFilter) {
    for (const [col, val] of Object.entries(config.publicFilter)) {
      conditions.push(`\`${col}\` = ?`);
      params.push(val);
    }
  }

  // User-ownership filter
  if (config.userOwned && userId) {
    conditions.push('`user_id` = ?');
    params.push(userId);
  }

  // Query-param filters
  for (const [rawKey, rawVal] of Object.entries(query)) {
    if (RESERVED_PARAMS.has(rawKey)) continue;

    let col = rawKey;
    let op  = '=';

    if (rawKey.endsWith('__gte'))  { col = rawKey.slice(0, -5); op = '>='; }
    else if (rawKey.endsWith('__lte'))  { col = rawKey.slice(0, -5); op = '<='; }
    else if (rawKey.endsWith('__neq'))  { col = rawKey.slice(0, -5); op = '!='; }
    else if (rawKey.endsWith('__like')) { col = rawKey.slice(0, -6); op = 'LIKE'; }

    if (!isSafe(col)) continue;

    // Don't let callers override the ownership filter
    if (config.userOwned && col === 'user_id') continue;

    if (rawVal === 'null' || rawVal === null) {
      conditions.push(`\`${col}\` IS NULL`);
    } else if (rawVal === 'true') {
      conditions.push(`\`${col}\` = ?`);
      params.push(1);
    } else if (rawVal === 'false') {
      conditions.push(`\`${col}\` = ?`);
      params.push(0);
    } else {
      conditions.push(`\`${col}\` ${op} ?`);
      params.push(rawVal);
    }
  }

  return { conditions, params };
}

/**
 * Parse ?select=col1,col2 into a safe SQL column list.
 * Falls back to '*' for anything unsafe or join syntax.
 */
function buildSelect(selectParam) {
  if (!selectParam || selectParam === '*') return '*';
  // PostgREST join syntax (e.g. "profiles(id,name)") → not supported, return *
  if (selectParam.includes('(')) return '*';
  const cols = selectParam.split(',').map((c) => c.trim()).filter(Boolean);
  const safe = cols.filter(isSafe);
  if (safe.length === 0) return '*';
  return safe.map((c) => `\`${c}\``).join(', ');
}

// ─── GET /api/:table ──────────────────────────────────────────────────────────
router.get('/:table', optionalAuth, async (req, res) => {
  const { table } = req.params;

  if (!isSafe(table) || !TABLE_CONFIG[table]) {
    return res.status(404).json({ error: 'Not found' });
  }

  const config = TABLE_CONFIG[table];

  if (!checkAccess(config.read, req)) {
    return res.status(config.read === 'admin' ? 403 : 401).json({ error: 'Unauthorized' });
  }

  try {
    const selectCols = buildSelect(req.query.select);
    const { conditions, params } = buildWhere(req.query, config, req);

    let sql = `SELECT ${selectCols} FROM \`${table}\``;
    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;

    // ORDER BY
    if (req.query.orderBy && isSafe(req.query.orderBy)) {
      const dir = req.query.ascending === 'false' ? 'DESC' : 'ASC';
      sql += ` ORDER BY \`${req.query.orderBy}\` ${dir}`;
    }

    // LIMIT / OFFSET
    const limit = parseInt(req.query.limit, 10);
    if (!isNaN(limit) && limit > 0) {
      sql += ` LIMIT ?`;
      params.push(Math.min(limit, 1000)); // hard cap at 1000 rows
    }

    const offset = parseInt(req.query.offset, 10);
    if (!isNaN(offset) && offset >= 0) {
      sql += ` OFFSET ?`;
      params.push(offset);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(`[rest] GET /${table}:`, err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── GET /api/:table/:id ──────────────────────────────────────────────────────
router.get('/:table/:id', optionalAuth, async (req, res) => {
  const { table, id } = req.params;

  if (!isSafe(table) || !TABLE_CONFIG[table]) {
    return res.status(404).json({ error: 'Not found' });
  }

  const config = TABLE_CONFIG[table];

  if (!checkAccess(config.read, req)) {
    return res.status(config.read === 'admin' ? 403 : 401).json({ error: 'Unauthorized' });
  }

  try {
    const { conditions, params } = buildWhere({}, config, req);

    conditions.push('`id` = ?');
    params.push(id);

    const sql = `SELECT * FROM \`${table}\` WHERE ${conditions.join(' AND ')} LIMIT 1`;
    const [rows] = await db.query(sql, params);

    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(`[rest] GET /${table}/${id}:`, err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── POST /api/:table ─────────────────────────────────────────────────────────
router.post('/:table', optionalAuth, async (req, res) => {
  const { table } = req.params;

  if (!isSafe(table) || !TABLE_CONFIG[table]) {
    return res.status(404).json({ error: 'Not found' });
  }

  const config = TABLE_CONFIG[table];

  if (!checkAccess(config.write, req)) {
    return res.status(config.write === 'admin' ? 403 : 401).json({ error: 'Unauthorized' });
  }

  try {
    let body = { ...req.body };
    const isUpsert = body._upsert === true;
    delete body._upsert;

    // Inject user_id for user-owned tables
    if (config.userOwned && req.user?.userId) {
      body.user_id = req.user.userId;
    }

    // Remove unsafe keys
    const safeBody = Object.fromEntries(
      Object.entries(body).filter(([k]) => isSafe(k))
    );

    if (Object.keys(safeBody).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    const cols   = Object.keys(safeBody).map((c) => `\`${c}\``).join(', ');
    const placeholders = Object.keys(safeBody).map(() => '?').join(', ');
    const values = Object.values(safeBody);

    let sql;
    if (isUpsert) {
      const updates = Object.keys(safeBody)
        .filter((c) => c !== 'id')
        .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
        .join(', ');
      sql = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})
             ON DUPLICATE KEY UPDATE ${updates}`;
    } else {
      sql = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`;
    }

    const [result] = await db.query(sql, values);

    // Return the inserted/upserted row
    const insertId = result.insertId;
    if (insertId) {
      const [rows] = await db.query(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [insertId]);
      return res.status(201).json(rows[0] ?? { id: insertId });
    }

    res.status(201).json({ affected: result.affectedRows });
  } catch (err) {
    console.error(`[rest] POST /${table}:`, err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Duplicate entry' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── PUT /api/:table/:id ──────────────────────────────────────────────────────
router.put('/:table/:id', optionalAuth, async (req, res) => {
  const { table, id } = req.params;

  if (!isSafe(table) || !TABLE_CONFIG[table]) {
    return res.status(404).json({ error: 'Not found' });
  }

  const config = TABLE_CONFIG[table];

  if (!checkAccess(config.write, req)) {
    return res.status(config.write === 'admin' ? 403 : 401).json({ error: 'Unauthorized' });
  }

  try {
    const body = { ...req.body };
    delete body.id; // Don't update PK

    const safeBody = Object.fromEntries(
      Object.entries(body).filter(([k]) => isSafe(k))
    );

    if (Object.keys(safeBody).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided' });
    }

    const setClauses = Object.keys(safeBody).map((c) => `\`${c}\` = ?`).join(', ');
    const values = [...Object.values(safeBody)];

    // For user-owned tables, ensure user can only update their own rows
    let sql;
    if (config.userOwned && req.user?.userId) {
      sql = `UPDATE \`${table}\` SET ${setClauses} WHERE id = ? AND user_id = ?`;
      values.push(id, req.user.userId);
    } else {
      sql = `UPDATE \`${table}\` SET ${setClauses} WHERE id = ?`;
      values.push(id);
    }

    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Row not found or access denied' });
    }

    const [rows] = await db.query(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
    res.json(rows[0] ?? { id });
  } catch (err) {
    console.error(`[rest] PUT /${table}/${id}:`, err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── DELETE /api/:table/:id ───────────────────────────────────────────────────
router.delete('/:table/:id', optionalAuth, async (req, res) => {
  const { table, id } = req.params;

  if (!isSafe(table) || !TABLE_CONFIG[table]) {
    return res.status(404).json({ error: 'Not found' });
  }

  const config = TABLE_CONFIG[table];

  if (!checkAccess(config.write, req)) {
    return res.status(config.write === 'admin' ? 403 : 401).json({ error: 'Unauthorized' });
  }

  try {
    let sql;
    const values = [];

    if (config.userOwned && req.user?.userId) {
      sql = `DELETE FROM \`${table}\` WHERE id = ? AND user_id = ?`;
      values.push(id, req.user.userId);
    } else {
      sql = `DELETE FROM \`${table}\` WHERE id = ?`;
      values.push(id);
    }

    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Row not found or access denied' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(`[rest] DELETE /${table}/${id}:`, err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
