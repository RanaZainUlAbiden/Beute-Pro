const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

// === DEBUG: Check if env variables are loaded ===
console.log('🔍 [passport.js] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');
console.log('🔍 [passport.js] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Loaded' : '❌ Missing');
console.log('🔍 [passport.js] BACKEND_URL:', process.env.BACKEND_URL || '❌ Missing');
// ============================================

// Serialize/deserialize user (required for session support)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, is_admin FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      // Or if backend handles callback: 'http://localhost:5000/api/auth/google/callback'
      // I'll make the callback hit the backend directly, then redirect to frontend with token.
      // We'll set this to backend URL, but we'll handle redirect manually.
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found from Google'), null);
        }

        // Check if user exists by google_id or email
        const existing = await pool.query(
          `SELECT id, email, full_name, is_admin FROM users WHERE google_id = $1 OR email = $2`,
          [profile.id, email]
        );

        let user;
        if (existing.rows.length > 0) {
          user = existing.rows[0];
          // If user exists but google_id is null, link it
          if (!user.google_id) {
            await pool.query(
              `UPDATE users SET google_id = $1 WHERE id = $2`,
              [profile.id, user.id]
            );
          }
        } else {
          // Create new user
          const name = profile.displayName || email.split('@')[0];
          const result = await pool.query(
            `INSERT INTO users (email, full_name, google_id, is_admin)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, full_name, is_admin`,
            [email, name, profile.id, false]
          );
          user = result.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;