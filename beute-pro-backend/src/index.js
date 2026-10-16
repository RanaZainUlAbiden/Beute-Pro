require('dotenv').config();
const express = require('express');
const path = require('node:path');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('./config/passport');
const pool = require('./config/db');

// Services
const emailService = require('./services/emailService');

// Import routes
const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const orderRoutes     = require('./routes/orderRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const currencyRoutes  = require('./routes/currencyRoutes');
const wishlistRoutes  = require('./routes/wishlistRoutes');
const contactRoutes   = require('./routes/contactRoutes');
const productRoutes   = require('./routes/productRoutes');
const categoryRoutes  = require('./routes/categoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const couponRoutes    = require('./routes/couponRoutes');
const settingsRoutes  = require('./routes/settingsRoutes');

// Import cron job
const { startExchangeRateJob } = require('./jobs/updateRates');

const app = express();
// Railway terminates HTTPS before forwarding to the application.
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// Local development only; R2 objects are served by the configured public CDN.
if (!process.env.R2_ACCESS_KEY_ID) {
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

// CORS - Allow multiple origins
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'https://beute-pro.vercel.app',
  'https://beute-pro-rana-zain-ul-abidens-projects.vercel.app',
  'https://beutepro.com',
  'https://www.beutepro.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
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
    maxAge: 24 * 60 * 60 * 1000,
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

// Wishlist
app.use('/api/wishlist', wishlistRoutes);

// Contact
app.use('/api/contact', contactRoutes);

// Public catalog
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Phase 5B — public endpoints
app.use('/api/inventory', inventoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);

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
app.listen(PORT, '::', () => {
  console.log(`🚀 Béute Pro backend running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);

  // Email status
  if (emailService.isEnabled()) {
    console.log('📧 Email notifications: ENABLED');
  } else {
    console.log('📧 Email notifications: DISABLED (set EMAIL_ENABLED=true to enable)');
  }

  // Start exchange rate cron job
  startExchangeRateJob();
});
