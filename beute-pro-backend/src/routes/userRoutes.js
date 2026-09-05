const express = require('express');
const { protect, requireAuth } = require('../middleware/auth');
const { getMe, updateMe, changePassword } = require('../controllers/authController'); // ✅ Added changePassword

const router = express.Router();

// All routes here are protected
router.use(protect);
router.use(requireAuth);

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/password', changePassword); // ✅ NEW: Change password route

module.exports = router;