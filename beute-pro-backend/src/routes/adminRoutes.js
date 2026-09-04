const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  adminListOrders,
  adminGetOrder,
  adminUpdateStatus,
  adminAddTracking,
  getRevenue,
} = require('../controllers/orderController');
const { getDashboardStats } = require('../controllers/dashboardController');
const { refreshRates } = require('../controllers/currencyController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminOnly);

// ============================================
// ORDER MANAGEMENT
// ============================================

// List all orders (with pagination & filters)
router.get('/orders', adminListOrders);

// Get single order by ID
router.get('/orders/:id', adminGetOrder);

// Update order status
router.put('/orders/:id/status', adminUpdateStatus);

// Add tracking number
router.put('/orders/:id/tracking', adminAddTracking);

// ============================================
// REVENUE & ANALYTICS
// ============================================

// Revenue summary
router.get('/revenue', getRevenue);

// Dashboard stats (comprehensive analytics)
router.get('/dashboard', getDashboardStats);

// ============================================
// CURRENCY MANAGEMENT
// ============================================

// Manually refresh exchange rates
router.post('/rates/refresh', refreshRates);

module.exports = router;