const pool = require('../config/db');

/** Transform a DB row into the same shape as products.ts. */
const mapRow = (row) => ({
  id: row.id,
  category: row.category_id,
  price: parseFloat(row.price),
  oldPrice: row.old_price === null ? null : parseFloat(row.old_price),
  badge: row.badge,
  images: row.images_count,
  spin: row.spin,
  size: row.size,
  en: row.en_data,
  ar: row.ar_data,
  isActive: row.is_active,
  displayOrder: row.display_order,
  mediaBaseUrl: row.media_base_url,
  videoBaseUrl: row.video_base_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * List products with filters:
 *   category (string)
 *   badge    (string)
 *   search   (string) — matches EN/AR name or tagline
 *   activeOnly (bool, default true)
 *   page, limit
 */
const getAll = async (filters = {}) => {
  const {
    category, badge, search,
    activeOnly = true,
    page = 1, limit = 100,
  } = filters;

  const where = [];
  const params = [];

  if (activeOnly) where.push(`is_active = TRUE`);

  if (category) {
    params.push(category);
    where.push(`category_id = $${params.length}`);
  }
  if (badge) {
    params.push(badge);
    where.push(`badge = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(en_data->>'name') LIKE $${params.length}
        OR LOWER(ar_data->>'name') LIKE $${params.length}
        OR LOWER(en_data->>'tagline') LIKE $${params.length}
        OR LOWER(ar_data->>'tagline') LIKE $${params.length})`
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const dataSql = `
    SELECT * FROM products
    ${whereSql}
    ORDER BY display_order ASC, id ASC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const dataRes = await pool.query(dataSql, [...params, limit, offset]);

  const countSql = `SELECT COUNT(*)::int AS total FROM products ${whereSql}`;
  const countRes = await pool.query(countSql, params);

  const total = countRes.rows[0].total;
  return {
    products: dataRes.rows.map(mapRow),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
};

const create = async (data) => {
  const {
    id, category, price, oldPrice, badge, size, images, spin,
    en, ar, isActive = true, displayOrder = 0,
    mediaBaseUrl, videoBaseUrl,
  } = data;

  const result = await pool.query(
    `INSERT INTO products
      (id, category_id, price, old_price, badge, size, images_count, spin,
       en_data, ar_data, is_active, display_order, media_base_url, video_base_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
             COALESCE($13, '/assets/img/products'),
             COALESCE($14, '/assets/video/spin'))
     RETURNING *`,
    [
      id, category, price, oldPrice ?? null, badge ?? null, size ?? null,
      images ?? 1, spin ?? false,
      JSON.stringify(en), JSON.stringify(ar),
      isActive, displayOrder,
      mediaBaseUrl ?? null, videoBaseUrl ?? null,
    ]
  );
  return mapRow(result.rows[0]);
};

const update = async (id, data) => {
  const {
    category, price, oldPrice, badge, size, images, spin,
    en, ar, isActive, displayOrder,
    mediaBaseUrl, videoBaseUrl,
  } = data;

  const result = await pool.query(
    `UPDATE products SET
       category_id     = COALESCE($2, category_id),
       price           = COALESCE($3, price),
       old_price       = $4,
       badge           = $5,
       size            = COALESCE($6, size),
       images_count    = COALESCE($7, images_count),
       spin            = COALESCE($8, spin),
       en_data         = COALESCE($9, en_data),
       ar_data         = COALESCE($10, ar_data),
       is_active       = COALESCE($11, is_active),
       display_order   = COALESCE($12, display_order),
       media_base_url  = COALESCE($13, media_base_url),
       video_base_url  = COALESCE($14, video_base_url),
       updated_at      = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id, category ?? null, price ?? null, oldPrice ?? null, badge ?? null,
      size ?? null, images ?? null, spin ?? null,
      en ? JSON.stringify(en) : null,
      ar ? JSON.stringify(ar) : null,
      isActive ?? null, displayOrder ?? null,
      mediaBaseUrl ?? null, videoBaseUrl ?? null,
    ]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
};

/** Soft delete (default) or hard delete. */
const remove = async (id, hard = false) => {
  if (hard) {
    const result = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id]);
    return result.rowCount > 0;
  }
  const result = await pool.query(
    `UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount > 0;
};

/** Look up prices only (used by orderService). */
const getPricesMap = async () => {
  const result = await pool.query(
    `SELECT id, price FROM products WHERE is_active = TRUE`
  );
  const map = {};
  for (const row of result.rows) map[row.id] = parseFloat(row.price);
  return map;
};

module.exports = { getAll, getById, create, update, remove, getPricesMap };