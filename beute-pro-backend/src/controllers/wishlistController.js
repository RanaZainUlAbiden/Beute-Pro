const wishlistService = require('../services/wishlistService');

/**
 * Get wishlist for authenticated user
 * GET /api/wishlist
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await wishlistService.getWishlist(userId);
    res.json({ items });
  } catch (err) {
    console.error('Get wishlist error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Add product to wishlist
 * POST /api/wishlist/:productId
 */
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    const result = await wishlistService.addToWishlist(userId, productId);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    console.error('Add wishlist error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Remove product from wishlist
 * DELETE /api/wishlist/:productId
 */
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    const result = await wishlistService.removeFromWishlist(userId, productId);
    if (!result.removed) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }
    res.json({ success: true, removed: true });
  } catch (err) {
    console.error('Remove wishlist error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Check if product is in wishlist
 * GET /api/wishlist/check/:productId
 */
const checkWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    const exists = await wishlistService.isInWishlist(userId, productId);
    res.json({ inWishlist: exists });
  } catch (err) {
    console.error('Check wishlist error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
};