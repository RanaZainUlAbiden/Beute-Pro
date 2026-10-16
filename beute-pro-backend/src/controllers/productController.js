const productService = require('../services/productService');

/** Public: list with filters */
const list = async (req, res) => {
  try {
    const { category, badge, search, page, limit } = req.query;
    const result = await productService.getAll({
      category,
      badge,
      search,
      activeOnly: true,
      includeMedia: req.query.includeMedia === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    res.json(result);
  } catch (err) {
    console.error('List products error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Public: single product */
const getOne = async (req, res) => {
  try {
    const product = await productService.getById(req.params.id, { includeMedia: req.query.includeMedia === 'true' });
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    console.error('Get product error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: list including inactive */
const adminList = async (req, res) => {
  try {
    const { category, badge, search, page, limit } = req.query;
    const result = await productService.getAll({
      category,
      badge,
      search,
      activeOnly: false,
      includeMedia: req.query.includeMedia === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list products error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: create */
const create = async (req, res) => {
  try {
    const product = await productService.create(req.body, { includeMedia: req.query.includeMedia === 'true' });
    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('Create product error:', err.message);
    if (err.code === '23505') return res.status(409).json({ error: 'Product ID already exists' });
    if (err.code === '23503') return res.status(400).json({ error: 'Invalid category' });
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: update */
const update = async (req, res) => {
  try {
    const product = await productService.update(req.params.id, req.body, { includeMedia: req.query.includeMedia === 'true' });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    console.error('Update product error:', err.message);
    if (err.code === '23503') return res.status(400).json({ error: 'Invalid category' });
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: soft delete */
const remove = async (req, res) => {
  try {
    const hard = req.query.hard === 'true';
    const ok = await productService.remove(req.params.id, hard);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, message: hard ? 'Product deleted' : 'Product deactivated' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { list, getOne, adminList, create, update, remove };
