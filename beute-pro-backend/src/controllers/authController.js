const { registerSchema, loginSchema, updateProfileSchema } = require('../utils/validators');
const authService = require('../services/authService');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { user, token } = await authService.registerUser(value);

    res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(400).json({ error: err.message });
  }
};

/**
 * Login a user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { user, token } = await authService.loginUser(value.email, value.password);

    res.json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).json({ error: err.message });
  }
};

/**
 * Get current authenticated user
 * GET /api/users/me
 */
const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update current user profile
 * PUT /api/users/me
 */
const updateMe = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await authService.updateUserProfile(req.user.id, value);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    console.error('UpdateMe error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Google OAuth callback
 * This is called by Passport after Google redirects
 */
const googleCallback = (req, res) => {
  // req.user is set by Passport
  if (!req.user) {
    // Redirect to frontend with error
    return res.redirect(`${process.env.FRONTEND_URL}/auth?error=google_auth_failed`);
  }

  // Generate JWT
  const token = require('../utils/jwt').generateToken({
    id: req.user.id,
    email: req.user.email,
    isAdmin: req.user.is_admin,
  });

  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  googleCallback,
};