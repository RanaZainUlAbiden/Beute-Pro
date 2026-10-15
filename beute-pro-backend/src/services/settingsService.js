const pool = require('../config/db');

/**
 * Fetch all settings as a plain { key: value } object.
 * Values are strings — callers convert as needed.
 */
const getAll = async () => {
  const result = await pool.query(`SELECT key, value FROM store_settings`);
  const out = {};
  for (const row of result.rows) out[row.key] = row.value;
  return out;
};

/** Fetch a single setting. Returns null if missing. */
const get = async (key) => {
  const result = await pool.query(
    `SELECT value FROM store_settings WHERE key = $1`,
    [key]
  );
  return result.rows[0] ? result.rows[0].value : null;
};

/** Upsert a single setting. */
const set = async (key, value) => {
  const result = await pool.query(
    `INSERT INTO store_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING key, value, updated_at`,
    [key, String(value)]
  );
  const row = result.rows[0];
  return { key: row.key, value: row.value, updatedAt: row.updated_at };
};

/** Bulk upsert — useful for saving the whole admin form at once. */
const setMany = async (pairs) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(pairs)) {
      await client.query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    await client.query('COMMIT');
    return await getAll();
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getAll, get, set, setMany };