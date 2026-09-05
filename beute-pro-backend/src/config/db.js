const { Pool } = require('pg');
require('dotenv').config();

// Aiven requires sslmode=no-verify in the connection string
const connectionString = process.env.DATABASE_URL.replace(
  'sslmode=require',
  'sslmode=no-verify'
);

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false, // Required for Aiven
  },
});

// Test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

module.exports = pool;