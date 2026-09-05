const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');

// Order controllers
const {
  adminListOrders,
  adminGetOrder,
  adminUpdateStatus,
  adminAddTracking,
  getRevenue,
} = require('../controllers/orderController');

// Dashboard & currency
const { getDashboardStats } = require('../controllers/dashboardController');
const { refreshRates } = require('../controllers/currencyController');

// ✅ Contact controllers
const {
  getMessages,
  updateMessageStatus,
  deleteMessage,
} = require('../controllers/contactController');

// Customer management
const {
  adminListCustomers,
  adminGetCustomer,
  adminUpdateCustomer,
  adminDeleteCustomer,
} = require('../controllers/customerController');

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

// ============================================
// CONTACT MANAGEMENT
// ============================================

// Get all contact messages (with filters & pagination)
router.get('/contact', getMessages);

// Update message status
router.put('/contact/:id/status', updateMessageStatus);

// Delete a message
router.delete('/contact/:id', deleteMessage);

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

// List all customers (search, sort, pagination)
router.get('/customers', adminListCustomers);

// Get a single customer
router.get('/customers/:id', adminGetCustomer);

// Update a customer's details
router.put('/customers/:id', adminUpdateCustomer);

// Delete a customer
router.delete('/customers/:id', adminDeleteCustomer);

module.exports = router;