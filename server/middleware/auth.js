/**
 * Authentication Middleware
 * JWT verification and user context attachment
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from Authorization header
 * Sets req.user = { userId, email, roles: [] } on success
 * Returns 401 on missing or invalid token
 */
const requireAuth = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        message: 'Authorization header must be in format: Bearer <token>',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      roles: decoded.roles || [],
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed',
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
};

/**
 * Optional authentication middleware
 * Same as requireAuth but doesn't fail if no token is present
 * Sets req.user = null if no valid token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, set user to null and continue
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      roles: decoded.roles || [],
    };

    next();
  } catch (error) {
    // If token is invalid, still continue but set user to null
    // This allows optional auth to fail gracefully
    req.user = null;
    next();
  }
};

/**
 * Check if user is authenticated
 * Returns true if req.user exists and has userId
 */
const isAuthenticated = (req) => {
  return req.user && req.user.userId;
};

/**
 * Get current user ID from request
 * Returns null if not authenticated
 */
const getUserId = (req) => {
  return req.user?.userId || null;
};

/**
 * Check if user has specific role
 * @param {string} role - Role to check (e.g., 'admin', 'editor')
 * @returns {boolean}
 */
const hasRole = (req, role) => {
  return req.user && req.user.roles && req.user.roles.includes(role);
};

module.exports = {
  requireAuth,
  optionalAuth,
  isAuthenticated,
  getUserId,
  hasRole,
};
