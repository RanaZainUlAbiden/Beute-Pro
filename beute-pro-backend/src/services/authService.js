const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new user
 */
const registerUser = async (userData) => {
  const { email, password, full_name, phone, address } = userData;

  // Check if user exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('User already exists with this email');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, phone, address, is_admin)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, full_name, phone, address, is_admin`,
    [email, hashedPassword, full_name, phone || null, address || null, false]
  );

  const user = result.rows[0];

  // Generate JWT
  const token = generateToken({
    id: user.id,
    email: user.email,
    isAdmin: user.is_admin,
  });

  return { user, token };
};

/**
 * Login a user
 */
const loginUser = async (email, password) => {
  // Find user
  const result = await pool.query(
    `SELECT id, email, password_hash, full_name, phone, address, is_admin
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Check password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT
  const token = generateToken({
    id: user.id,
    email: user.email,
    isAdmin: user.is_admin,
  });

  // Remove password hash from response
  delete user.password_hash;

  return { user, token };
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, email, full_name, phone, address, is_admin, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Update user profile
 */
const updateUserProfile = async (id, updates) => {
  const { full_name, phone, address } = updates;
  const result = await pool.query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         address = COALESCE($3, address),
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, email, full_name, phone, address, is_admin`,
    [full_name, phone, address, id]
  );
  return result.rows[0] || null;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
};