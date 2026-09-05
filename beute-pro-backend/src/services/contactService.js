const pool = require('../config/db');

/**
 * Create a new contact message
 */
const createMessage = async (name, email, message) => {
  const result = await pool.query(
    `INSERT INTO contact_messages (name, email, message)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, message, status, created_at`,
    [name, email, message]
  );
  return result.rows[0];
};

/**
 * Get all contact messages (admin)
 */
const getAllMessages = async (filters = {}) => {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = '';
  let params = [];
  let paramIndex = 1;
  if (status) {
    whereClause = `WHERE status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  const query = `
    SELECT * FROM contact_messages
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) FROM contact_messages ${whereClause}`;
  const countResult = await pool.query(countQuery, params.slice(0, paramIndex - 1));
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    messages: result.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Update message status (admin)
 */
const updateStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE contact_messages
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

/**
 * Delete a message (admin)
 */
const deleteMessage = async (id) => {
  const result = await pool.query(
    `DELETE FROM contact_messages WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount > 0;
};

module.exports = {
  createMessage,
  getAllMessages,
  updateStatus,
  deleteMessage,
};