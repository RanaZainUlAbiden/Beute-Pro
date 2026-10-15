const pool = require('../config/db');

/** Transform a DB row into the shape the frontend expects. */
const mapRow = (row) => ({
  id: row.id,
  en: row.en_name,
  ar: row.ar_name,
  imageUrl: row.image_url,
  displayOrder: row.display_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getAll = async () => {
  const result = await pool.query(
    `SELECT * FROM categories ORDER BY display_order ASC, id ASC`
  );
  return result.rows.map(mapRow);
};

const getById = async (id) => {
  const result = await pool.query(`SELECT * FROM categories WHERE id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
};

const create = async ({ id, en, ar, imageUrl, displayOrder }) => {
  const result = await pool.query(
    `INSERT INTO categories (id, en_name, ar_name, image_url, display_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, en, ar, imageUrl || null, displayOrder ?? 0]
  );
  return mapRow(result.rows[0]);
};

const update = async (id, { en, ar, imageUrl, displayOrder }) => {
  const result = await pool.query(
    `UPDATE categories
     SET en_name = COALESCE($2, en_name),
         ar_name = COALESCE($3, ar_name),
         image_url = COALESCE($4, image_url),
         display_order = COALESCE($5, display_order),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, en ?? null, ar ?? null, imageUrl ?? null, displayOrder ?? null]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
};

const remove = async (id) => {
  // Block deletion if any product still uses this category
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1`,
    [id]
  );
  if (countRes.rows[0].count > 0) {
    const err = new Error(`Cannot delete category: ${countRes.rows[0].count} product(s) still use it`);
    err.status = 409;
    throw err;
  }
  const result = await pool.query(`DELETE FROM categories WHERE id = $1 RETURNING id`, [id]);
  return result.rowCount > 0;
};

module.exports = { getAll, getById, create, update, remove };