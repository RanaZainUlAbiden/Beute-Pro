const express = require('express');
const passport = require('passport');
const { register, login, googleCallback } = require('../controllers/authController');

const router = express.Router();

// Local auth
router.post('/register', register);
router.post('/login', login);

// Google OAuth
router.use('/google', (_req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: 'Google sign-in is not configured' });
  }
  next();
});
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: true, failureRedirect: `${process.env.FRONTEND_URL}/auth?error=google_failed` }),
  googleCallback
);

module.exports = router;
