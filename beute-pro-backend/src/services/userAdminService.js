const pool = require('../config/db');

const SORTABLE = new Set(['full_name', 'email', 'created_at', 'order_count']);

/**
 * List ALL users (admins + customers) with search, role filter, sort, pagination.
 * order_count comes from LEFT JOIN so users with no orders still show up.
 */
const listAll = async (filters = {}) => {
  const {
    search,
    role,                                // 'admin' | 'customer' | undefined
    sortBy = 'created_at',
    sortDir = 'desc',
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;
  const column = SORTABLE.has(sortBy) ? sortBy : 'created_at';
  const direction = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const params = [];
  const where = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(
      `(u.full_name ILIKE $${params.length}
        OR u.email ILIKE $${params.length}
        OR u.phone ILIKE $${params.length})`
    );
  }
  if (role === 'admin') where.push(`u.is_admin = TRUE`);
  if (role === 'customer') where.push(`u.is_admin = FALSE`);

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const query = `
    SELECT u.id, u.full_name, u.email, u.phone, u.address, u.is_admin, u.created_at,
           COUNT(o.id)::int AS order_count
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    ${whereSql}
    GROUP BY u.id
    ORDER BY ${column === 'order_count' ? 'order_count' : `u.${column}`} ${direction}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  const result = await pool.query(query, [...params, limit, offset]);

  const countQuery = `SELECT COUNT(*) FROM users u ${whereSql}`;
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    users: result.rows,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

/** Single user by ID (includes admins). */
const getById = async (id) => {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.address, u.is_admin, u.created_at,
            COUNT(o.id)::int AS order_count
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );
  return result.rows[0] || null;
};

/** Count how many admins exist right now. */
const countAdmins = async () => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE is_admin = TRUE`
  );
  return result.rows[0].count;
};

/**
 * Set a user's admin role.
 * Safety rails:
 *   • Cannot demote yourself (avoids accidental lockout)
 *   • Cannot demote the last remaining admin
 */
const setRole = async (targetId, isAdmin, requesterId) => {
  if (!isAdmin && targetId === requesterId) {
    const err = new Error('You cannot remove your own admin access');
    err.status = 400;
    throw err;
  }

  if (!isAdmin) {
    const admins = await countAdmins();
    if (admins <= 1) {
      const err = new Error('Cannot demote the last remaining admin');
      err.status = 400;
      throw err;
    }
  }

  const result = await pool.query(
    `UPDATE users
     SET is_admin = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, full_name, email, phone, address, is_admin, created_at`,
    [targetId, isAdmin]
  );

  return result.rows[0] || null;
};

module.exports = { listAll, getById, countAdmins, setRole };