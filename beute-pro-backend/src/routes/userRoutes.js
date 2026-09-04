const express = require('express');
const { protect } = require('../middleware/auth');
const { getMe, updateMe } = require('../controllers/authController');

const router = express.Router();

// All routes here are protected
router.use(protect);

router.get('/me', getMe);
router.put('/me', updateMe);

module.exports = router;