const express = require('express');
const { validateCoupon } = require('../controllers/couponController');

const router = express.Router();

// Public: validate a coupon at checkout
router.post('/validate', validateCoupon);

module.exports = router;