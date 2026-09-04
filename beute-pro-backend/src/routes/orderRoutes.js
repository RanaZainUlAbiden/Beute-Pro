const express = require('express');
const { protect } = require('../middleware/auth');
const { placeOrder, getMyOrders, trackOrder } = require('../controllers/orderController');

const router = express.Router();

// ✅ FIXED: Added 'protect' middleware so req.user gets populated for authenticated users
router.post('/', protect, placeOrder);

// Public: track by order number (no auth required)
router.get('/track/:orderNumber', trackOrder);

// Protected: user's own orders
router.get('/my', protect, getMyOrders);

module.exports = router;