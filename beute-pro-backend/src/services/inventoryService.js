const pool = require('../config/db');

/** Default stock assigned to any product without an inventory row. */
const DEFAULT_STOCK = 50;

/**
 * Fetch inventory for a single product. If no row exists yet, returns
 * a virtual default (quantity = DEFAULT_STOCK) so the frontend never
 * sees "undefined stock" for a freshly-seeded product.
 */
const getByProductId = async (productId) => {
  const result = await pool.query(
    `SELECT product_id, quantity, low_stock_threshold, updated_at
     FROM inventory WHERE product_id = $1`,
    [productId]
  );
  if (result.rows.length > 0) {
    const row = result.rows[0];
    return {
      productId: row.product_id,
      quantity: row.quantity,
      lowStockThreshold: row.low_stock_threshold,
      updatedAt: row.updated_at,
    };
  }
  return {
    productId,
    quantity: DEFAULT_STOCK,
    lowStockThreshold: 5,
    updatedAt: null,
  };
};

/**
 * Fetch inventory for many products at once (used at checkout).
 * Returns a Map<productId, quantity>.
 */
const getQuantitiesMap = async (productIds) => {
  if (!productIds.length) return new Map();
  const result = await pool.query(
    `SELECT product_id, quantity FROM inventory WHERE product_id = ANY($1)`,
    [productIds]
  );
  const map = new Map();
  for (const row of result.rows) map.set(row.product_id, row.quantity);
  return map;
};

/**
 * Admin: list all inventory rows (join with products to show name).
 */
const listAll = async (filters = {}) => {
  const { search, lowStockOnly = false } = filters;

  const where = [];
  const params = [];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(LOWER(p.en_data->>'name') LIKE $${params.length}
                 OR LOWER(p.id) LIKE $${params.length})`);
  }
  if (lowStockOnly) {
    where.push(`i.quantity <= i.low_stock_threshold`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT
       p.id AS product_id,
       p.en_data->>'name' AS product_name_en,
       p.ar_data->>'name' AS product_name_ar,
       COALESCE(i.quantity, ${DEFAULT_STOCK}) AS quantity,
       COALESCE(i.low_stock_threshold, 5) AS low_stock_threshold,
       i.updated_at
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     ${whereSql}
     ORDER BY p.display_order ASC, p.id ASC`,
    params
  );

  return result.rows.map(r => ({
    productId: r.product_id,
    productNameEn: r.product_name_en,
    productNameAr: r.product_name_ar,
    quantity: r.quantity,
    lowStockThreshold: r.low_stock_threshold,
    isLow: r.quantity <= r.low_stock_threshold,
    updatedAt: r.updated_at,
  }));
};

/**
 * Admin: set absolute stock for a product.
 */
const setQuantity = async (productId, quantity, lowStockThreshold) => {
  if (quantity < 0) throw new Error('Quantity cannot be negative');

  const result = await pool.query(
    `INSERT INTO inventory (product_id, quantity, low_stock_threshold, updated_at)
     VALUES ($1, $2, COALESCE($3, 5), NOW())
     ON CONFLICT (product_id) DO UPDATE
     SET quantity = EXCLUDED.quantity,
         low_stock_threshold = COALESCE($3, inventory.low_stock_threshold),
         updated_at = NOW()
     RETURNING product_id, quantity, low_stock_threshold, updated_at`,
    [productId, quantity, lowStockThreshold ?? null]
  );

  const row = result.rows[0];
  return {
    productId: row.product_id,
    quantity: row.quantity,
    lowStockThreshold: row.low_stock_threshold,
    updatedAt: row.updated_at,
  };
};

/**
 * Decrement stock for a batch of items during checkout.
 * Runs inside a transaction (caller must pass the client).
 * Blocks overselling: throws if any item has insufficient stock.
 *
 * @param {Object} client - pg client from a transaction
 * @param {Array<{productId: string, quantity: number}>} items
 */
const decrementForOrder = async (client, items) => {
  for (const item of items) {
    // Lock the row for the duration of the transaction
    const res = await client.query(
      `SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE`,
      [item.productId]
    );

    let currentQty;
    if (res.rows.length === 0) {
      // Product has no inventory row → treat as DEFAULT_STOCK, insert one now
      currentQty = DEFAULT_STOCK;
      await client.query(
        `INSERT INTO inventory (product_id, quantity, low_stock_threshold)
         VALUES ($1, $2, 5)
         ON CONFLICT (product_id) DO NOTHING`,
        [item.productId, currentQty]
      );
    } else {
      currentQty = res.rows[0].quantity;
    }

    if (currentQty < item.quantity) {
      const err = new Error(
        `Insufficient stock for product ${item.productId}: requested ${item.quantity}, available ${currentQty}`
      );
      err.status = 409;
      throw err;
    }

    await client.query(
      `UPDATE inventory
       SET quantity = quantity - $2, updated_at = NOW()
       WHERE product_id = $1`,
      [item.productId, item.quantity]
    );
  }
};

/**
 * Admin: list low-stock items only (for a dashboard widget).
 */
const listLowStock = async () => {
  const result = await pool.query(
    `SELECT
       p.id AS product_id,
       p.en_data->>'name' AS product_name_en,
       i.quantity,
       i.low_stock_threshold
     FROM inventory i
     JOIN products p ON p.id = i.product_id
     WHERE i.quantity <= i.low_stock_threshold
     ORDER BY i.quantity ASC`
  );
  return result.rows;
};

module.exports = {
  DEFAULT_STOCK,
  getByProductId,
  getQuantitiesMap,
  listAll,
  listLowStock,
  setQuantity,
  decrementForOrder,
};