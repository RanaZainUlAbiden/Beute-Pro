const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Detect whether we're connecting to a remote (cloud) host or localhost.
// Local Postgres doesn't support SSL; Aiven / Railway / Render / Neon do.
const isLocalhost = /(?:localhost|127\.0\.0\.1)/.test(connectionString);

const poolConfig = {
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (!isLocalhost) {
  // Cloud Postgres (Aiven, Heroku, Railway, etc.) — SSL required.
  // sslmode=no-verify is Aiven-friendly: encrypt but skip CA verification.
  poolConfig.connectionString = connectionString.replace(
    'sslmode=require',
    'sslmode=no-verify'
  );
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  // Local Postgres — no SSL.
  poolConfig.ssl = false;
}

const pool = new Pool(poolConfig);

// Test the connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
  } else {
    const host = isLocalhost ? 'local' : 'cloud';
    console.log(`✅ Database connected (${host}) at:`, res.rows[0].now);
  }
});

module.exports = pool;