const pool = require('../config/db');

const mapRow = (row) => ({
  code: row.code,
  discountType: row.discount_type,
  discountValue: parseFloat(row.discount_value),
  minOrderValue: parseFloat(row.min_order_value),
  maxUses: row.max_uses,
  usedCount: row.used_count,
  expiresAt: row.expires_at,
  isActive: row.is_active,
  createdAt: row.created_at,
});

/** Admin: list all coupons (paginated, optional status filter). */
const listAll = async (filters = {}) => {
  const { activeOnly, page = 1, limit = 50 } = filters;
  const where = activeOnly ? `WHERE is_active = TRUE` : '';
  const offset = (page - 1) * limit;

  const dataRes = await pool.query(
    `SELECT * FROM coupons ${where}
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM coupons ${where}`);
  const total = countRes.rows[0].total;

  return {
    coupons: dataRes.rows.map(mapRow),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

const getByCode = async (code) => {
  const result = await pool.query(
    `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)`,
    [code]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
};

/** Admin: create a new coupon. */
const create = async (data) => {
  const {
    code,
    discountType,
    discountValue,
    minOrderValue = 0,
    maxUses = null,
    expiresAt = null,
    isActive = true,
  } = data;

  const result = await pool.query(
    `INSERT INTO coupons
      (code, discount_type, discount_value, min_order_value, max_uses, expires_at, is_active)
     VALUES (UPPER($1), $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [code, discountType, discountValue, minOrderValue, maxUses, expiresAt, isActive]
  );
  return mapRow(result.rows[0]);
};

/** Admin: update an existing coupon. */
const update = async (code, data) => {
  const {
    discountType,
    discountValue,
    minOrderValue,
    maxUses,
    expiresAt,
    isActive,
  } = data;

  const result = await pool.query(
    `UPDATE coupons SET
       discount_type    = COALESCE($2, discount_type),
       discount_value   = COALESCE($3, discount_value),
       min_order_value  = COALESCE($4, min_order_value),
       max_uses         = $5,
       expires_at       = $6,
       is_active        = COALESCE($7, is_active)
     WHERE UPPER(code) = UPPER($1)
     RETURNING *`,
    [code, discountType ?? null, discountValue ?? null, minOrderValue ?? null,
     maxUses ?? null, expiresAt ?? null, isActive ?? null]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
};

/** Admin: delete. */
const remove = async (code) => {
  const result = await pool.query(
    `DELETE FROM coupons WHERE UPPER(code) = UPPER($1) RETURNING code`,
    [code]
  );
  return result.rowCount > 0;
};

/**
 * Validate a coupon against a given order total.
 * Returns { valid, discount, reason } — never throws.
 */
const validate = async (code, orderTotal) => {
  const coupon = await getByCode(code);
  if (!coupon) return { valid: false, discount: 0, reason: 'Coupon not found' };
  if (!coupon.isActive) return { valid: false, discount: 0, reason: 'Coupon is inactive' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, discount: 0, reason: 'Coupon has expired' };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, reason: 'Coupon usage limit reached' };
  }
  if (orderTotal < coupon.minOrderValue) {
    return {
      valid: false,
      discount: 0,
      reason: `Minimum order value of Rs ${coupon.minOrderValue} not met`,
    };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = +(orderTotal * (coupon.discountValue / 100)).toFixed(2);
  } else {
    discount = Math.min(coupon.discountValue, orderTotal);
  }

  return { valid: true, discount, coupon, reason: null };
};

/**
 * Increment used_count for a coupon. Called inside the order transaction.
 */
const incrementUsage = async (client, code) => {
  await client.query(
    `UPDATE coupons
     SET used_count = used_count + 1
     WHERE UPPER(code) = UPPER($1)`,
    [code]
  );
};

module.exports = {
  listAll,
  getByCode,
  create,
  update,
  remove,
  validate,
  incrementUsage,
};