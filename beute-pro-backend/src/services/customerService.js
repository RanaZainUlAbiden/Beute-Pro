const pool = require('../config/db');

const SORTABLE = new Set(['full_name', 'email', 'created_at', 'order_count']);

/**
 * Admin: list registered customers (non-admin users) with search, sort and pagination.
 * order_count comes from a LEFT JOIN so customers with no orders still show up.
 */
const getAllCustomers = async (filters = {}) => {
  const { search, sortBy = 'created_at', sortDir = 'desc', page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const column = SORTABLE.has(sortBy) ? sortBy : 'created_at';
  const direction = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const params = [];
  let where = 'WHERE u.is_admin = FALSE';
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
  }

  const query = `
    SELECT u.id, u.full_name, u.email, u.phone, u.address, u.created_at,
           COUNT(o.id)::int AS order_count
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    ${where}
    GROUP BY u.id
    ORDER BY ${column === 'order_count' ? 'order_count' : `u.${column}`} ${direction}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const result = await pool.query(query, [...params, limit, offset]);

  const countQuery = `SELECT COUNT(*) FROM users u ${where}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    customers: result.rows,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

const getCustomerById = async (id) => {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.address, u.is_admin, u.created_at,
            COUNT(o.id)::int AS order_count
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id],
  );
  return result.rows[0] || null;
};

const findByEmail = async (email, excludingId) => {
  const result = await pool.query(
    'SELECT id FROM users WHERE email = $1 AND id != $2',
    [email, excludingId],
  );
  return result.rows[0] || null;
};

const updateCustomer = async (id, { full_name, email, phone, address }) => {
  const result = await pool.query(
    `UPDATE users
     SET full_name = $1, email = $2, phone = $3, address = $4, updated_at = NOW()
     WHERE id = $5 AND is_admin = FALSE
     RETURNING id, full_name, email, phone, address, is_admin, created_at`,
    [full_name, email, phone, address, id],
  );
  return result.rows[0] || null;
};

/**
 * Admin: delete a customer.
 *
 * Schema note (see migrations/001_initial-schema.up.sql): orders.user_id is
 * `REFERENCES users(id) ON DELETE SET NULL`, and every order also carries its
 * own customer_name / customer_email / customer_phone / shipping_address
 * columns, copied at checkout. Deleting the user only nulls the FK — it does
 * not touch order_items, does not orphan the order (it keeps its full,
 * independent snapshot of who it was for), and never violates referential
 * integrity. A hard delete is therefore schema-safe; no soft-delete column
 * is needed for this to work.
 */
const deleteCustomer = async (id) => {
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 AND is_admin = FALSE RETURNING id`,
    [id],
  );
  return result.rowCount > 0;
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  findByEmail,
  updateCustomer,
  deleteCustomer,
};
