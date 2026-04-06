const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to generate JWT token
const generateToken = (userId, email, roles = []) => {
  return jwt.sign(
    { userId, email, roles },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, display_name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const userResult = await db.query(
      'INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email',
      [userId, email, hashedPassword]
    );

    // Create profile
    const profileDisplayName = display_name || email.split('@')[0];
    await db.query(
      'INSERT INTO profiles (user_id, display_name, created_at) VALUES ($1, $2, NOW())',
      [userId, profileDisplayName]
    );

    // Generate token
    const token = generateToken(userId, email, []);

    res.status(201).json({
      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const userResult = await db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user roles
    const rolesResult = await db.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [user.id]
    );

    const roles = rolesResult.rows.map(r => r.role);

    // Generate token
    const token = generateToken(user.id, user.email, roles);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        roles
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (stateless - client discards token)
 */
router.post('/logout', requireAuth, (req, res) => {
  res.json({ success: true });
});

/**
 * GET /api/auth/session
 * Get current user session
 */
router.get('/session', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get user and profile
    const userResult = await db.query(
      `SELECT u.id, u.email, p.display_name, p.bio, p.avatar_url
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];

    // Get roles
    const rolesResult = await db.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [userId]
    );

    const roles = rolesResult.rows.map(r => r.role);

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        roles,
        profile: {
          display_name: userData.display_name,
          bio: userData.bio,
          avatar_url: userData.avatar_url
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/request-password-reset
 * Request a password reset link
 */
router.post('/request-password-reset', async (req, res) => {
  // Stub implementation for security (don't reveal if email exists)
  res.json({
    success: true,
    message: 'If this email exists, a reset link will be sent.'
  });
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req, res) => {
  // Stub implementation
  res.json({
    success: true,
    message: 'If this email exists, a reset link will be sent.'
  });
});

module.exports = router;
