const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to protect routes — verifies JWT from Authorization header
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // ✅ For order placement, we allow guests — but we just set req.user = null
    // The controller checks: const userId = req.user ? req.user.id : null;
    // So we don't return 401 here, we just proceed without a user
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    // If token is invalid, we treat as guest
    req.user = null;
    return next();
  }

  // Attach user info to request
  req.user = {
    id: decoded.id,
    email: decoded.email,
    isAdmin: decoded.isAdmin || false,
  };

  next();
};

/**
 * Middleware to check if user is admin
 * This MUST be used AFTER protect
 */
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

/**
 * Middleware to require a logged-in user — use AFTER protect.
 * `protect` never rejects by itself (it lets guests through with
 * req.user = null, e.g. for guest checkout), so any route whose
 * controller actually needs req.user must add this too — otherwise
 * a missing/expired/invalid token reaches the controller as a null
 * user and crashes with a 500 instead of failing cleanly with 401.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

module.exports = { protect, adminOnly, requireAuth };