const express = require('express');
const { getRates } = require('../controllers/currencyController');

const router = express.Router();

// Public route to get exchange rates
router.get('/', getRates);

module.exports = router;