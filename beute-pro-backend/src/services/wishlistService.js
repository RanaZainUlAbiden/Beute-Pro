const pool = require('../config/db');

/**
 * Get all wishlist items for a user
 */
const getWishlist = async (userId) => {
  const result = await pool.query(
    `SELECT product_id, created_at FROM wishlist WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows.map(row => row.product_id);
};

/**
 * Add a product to wishlist
 */
const addToWishlist = async (userId, productId) => {
  // Check if already exists
  const existing = await pool.query(
    `SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  if (existing.rows.length > 0) {
    // Already exists, return without error (idempotent)
    return { added: false, alreadyExists: true };
  }

  await pool.query(
    `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)`,
    [userId, productId]
  );
  return { added: true, alreadyExists: false };
};

/**
 * Remove a product from wishlist
 */
const removeFromWishlist = async (userId, productId) => {
  const result = await pool.query(
    `DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id`,
    [userId, productId]
  );
  return { removed: result.rowCount > 0 };
};

/**
 * Check if a product is in a user's wishlist
 */
const isInWishlist = async (userId, productId) => {
  const result = await pool.query(
    `SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return result.rows.length > 0;
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
};