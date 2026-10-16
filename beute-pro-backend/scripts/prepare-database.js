require('dotenv').config();
const { default: runner } = require('node-pg-migrate');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

(async () => {
  // node-pg-migrate records applied files and locks against concurrent deployments.
  await runner({
    databaseUrl: process.env.DATABASE_URL,
    dir: join(__dirname, '../migrations'),
    ignorePattern: '.*\\.down\\.sql',
    direction: 'up',
    migrationsTable: 'pgmigrations',
    checkOrder: true,
  });
  const pool = require('../src/config/db');
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM products');
    if (rows[0].count === 0) {
      const result = spawnSync(process.execPath, [join(__dirname, '../src/seed/001_categories_and_products.js')], {
        stdio: 'inherit', env: process.env,
      });
      if (result.error || result.status !== 0) throw new Error('Initial catalog seed failed');
    }
  } finally {
    await pool.end();
  }
})().catch((error) => {
  console.error('Database preparation failed:', error);
  process.exitCode = 1;
});
