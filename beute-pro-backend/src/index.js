require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('./config/passport');
const pool = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const contactRoutes = require('./routes/contactRoutes');


// Import cron job
const { startExchangeRateJob } = require('./jobs/updateRates');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS - Allow multiple origins
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://beute-pro.vercel.app',
  'https://beute-pro-rana-zain-ul-abidens-projects.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (required for Passport Google OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      status: 'OK',
      db: 'connected',
      serverTime: result.rows[0].time,
      env: process.env.NODE_ENV,
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: 'disconnected', error: err.message });
  }
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// User routes (protected)
app.use('/api/users', userRoutes);

// Order routes (public + user)
app.use('/api/orders', orderRoutes);

// Admin routes (protected)
app.use('/api/admin', adminRoutes);

// Currency routes (public)
app.use('/api/rates', currencyRoutes);

app.use('/api/wishlist', wishlistRoutes);

app.use('/api/contact', contactRoutes);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Béute Pro backend running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  
  // Start exchange rate cron job
  startExchangeRateJob();
});