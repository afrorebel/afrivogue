/**
 * Admin Authorization Middleware
 * Checks that user has 'admin' role
 * Must be used after requireAuth middleware
 */

/**
 * Check if user has admin role
 * Returns 403 if user is not authenticated or doesn't have admin role
 * Must be used after requireAuth middleware
 */
const requireAdmin = (req, res, next) => {
  // Check if user is authenticated (requireAuth should have been called first)
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Check if user has admin role
  if (!req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required',
    });
  }

  next();
};

/**
 * Check if user has any of the specified roles
 * Returns 403 if user doesn't have any of the roles
 * Must be used after requireAuth middleware
 * @param {string[]} roles - Array of allowed roles (e.g., ['admin', 'editor'])
 */
const requireRoles = (roles = []) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user has any of the required roles
    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `One of these roles required: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Check if user has specific role
 * Returns true if user is authenticated and has the role
 */
const hasRole = (req, role) => {
  if (!req.user) return false;
  return req.user.roles && req.user.roles.includes(role);
};

/**
 * Check if user has any of multiple roles
 * Returns true if user has at least one of the roles
 */
const hasAnyRole = (req, roles = []) => {
  if (!req.user) return false;
  const userRoles = req.user.roles || [];
  return roles.some((role) => userRoles.includes(role));
};

module.exports = {
  requireAdmin,
  requireRoles,
  hasRole,
  hasAnyRole,
};
