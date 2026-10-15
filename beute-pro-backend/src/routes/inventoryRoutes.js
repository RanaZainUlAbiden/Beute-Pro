const express = require('express');
const { getOne } = require('../controllers/inventoryController');

const router = express.Router();

// Public: stock lookup for a single product
router.get('/:productId', getOne);

module.exports = router;