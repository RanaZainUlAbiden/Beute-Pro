const couponService = require('../services/couponService');

/** Public: validate a coupon against a cart total. */
const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code || typeof orderTotal !== 'number') {
      return res.status(400).json({ error: 'code and orderTotal are required' });
    }
    const result = await couponService.validate(code, orderTotal);
    res.json(result);
  } catch (err) {
    console.error('Validate coupon error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: list all coupons. */
const adminList = async (req, res) => {
  try {
    const { activeOnly, page, limit } = req.query;
    const result = await couponService.listAll({
      activeOnly: activeOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list coupons error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: create. */
const adminCreate = async (req, res) => {
  try {
    const coupon = await couponService.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    console.error('Create coupon error:', err.message);
    if (err.code === '23505') return res.status(409).json({ error: 'Coupon code already exists' });
    if (err.code === '23514') return res.status(400).json({ error: 'Invalid discount type or value' });
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: update. */
const adminUpdate = async (req, res) => {
  try {
    const coupon = await couponService.update(req.params.code, req.body);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) {
    console.error('Update coupon error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/** Admin: delete. */
const adminRemove = async (req, res) => {
  try {
    const ok = await couponService.remove(req.params.code);
    if (!ok) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    console.error('Delete coupon error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  validateCoupon,
  adminList,
  adminCreate,
  adminUpdate,
  adminRemove,
};