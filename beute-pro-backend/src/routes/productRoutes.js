const express = require('express');
const { list, getOne } = require('../controllers/productController');

const router = express.Router();

// Catalog reads opt in to nested media with ?includeMedia=true; legacy is default.

router.get('/', list);
router.get('/:id', getOne);

module.exports = router;
