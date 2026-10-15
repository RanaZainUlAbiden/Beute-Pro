const express = require('express');
const { getPublic } = require('../controllers/settingsController');

const router = express.Router();

// Public: safe settings (free-shipping threshold, etc.)
router.get('/', getPublic);

module.exports = router;