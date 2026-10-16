const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFile, access, rmdir } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const databaseUrl = process.env.MEDIA_TEST_DATABASE_URL;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const video = Buffer.concat([Buffer.from([0, 0, 0, 16]), Buffer.from('ftypisom'), Buffer.alloc(4)]);
const filePath = (key) => path.join(__dirname, '../uploads', key);

test('product media integrates with an isolated PostgreSQL database and local storage', {
  skip: databaseUrl ? false : 'Set MEDIA_TEST_DATABASE_URL to a disposable local beute_media_test database',
}, async (t) => {
  const url = new URL(databaseUrl);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Never test against a remote database');
  assert.equal(url.pathname, '/beute_media_test', 'Use a dedicated disposable test database');
  process.env.DATABASE_URL = databaseUrl;
  process.env.R2_ACCESS_KEY_ID = ''; // dotenv must never select real R2 during these tests
  const pool = require('../src/config/db');
  const media = require('../src/services/productMediaService');
  const storage = require('../src/services/storageService');
  t.after(() => pool.end());

  await pool.query(`INSERT INTO categories (id, en_name, ar_name)
    VALUES ('media-test-category', 'Media test', 'Media test') ON CONFLICT DO NOTHING`);
  const fixture = async (subtest) => {
    const id = `media-test-${randomUUID()}`;
    await pool.query(`INSERT INTO products (id, category_id, price, en_data, ar_data)
      VALUES ($1, 'media-test-category', 10, $2, $2)`, [id, { name: 'Media test' }]);
    subtest.after(async () => {
      await media.removeAllForProduct(id);
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      // Remove only this test product's empty directory; never static assets.
      await rmdir(path.join(__dirname, '../uploads/products', id)).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    });
    return id;
  };

  await t.test('uploads record bytes, type, public URL and requested ordering', async (subtest) => {
    const id = await fixture(subtest);
    const first = await media.addMedia(id, 'image', png, 'image/png', '../../untrusted-name.svg', 5);
    const second = await media.addMedia(id, 'image', png, 'image/png', 'another.png', 0);
    assert.equal(first.storage_key, `products/${id}/${id}-1.png`);
    assert.equal(second.storage_key, `products/${id}/${id}-2.png`);
    assert.equal(first.url, `/uploads/${first.storage_key}`);
    assert.equal(first.file_size, png.length);
    assert.equal(first.mime_type, 'image/png');
    assert.deepEqual(await readFile(filePath(first.storage_key)), png);
    assert.deepEqual((await media.listByProduct(id)).map((row) => row.id), [second.id, first.id]);
  });

  await t.test('concurrent image uploads allocate distinct keys and preserve remaining images after deletion', async (subtest) => {
    const id = await fixture(subtest);
    const rows = await Promise.all(Array.from({ length: 8 }, () => media.addMedia(id, 'image', png, 'image/png', 'image.png')));
    assert.equal(new Set(rows.map((row) => row.storage_key)).size, 8);
    assert.deepEqual((await media.listByProduct(id)).map((row) => row.sort_order), [0, 1, 2, 3, 4, 5, 6, 7]);
    const removed = rows.find((row) => row.storage_key.endsWith('-2.png'));
    await media.removeMedia(removed.id);
    await assert.rejects(access(filePath(removed.storage_key)), { code: 'ENOENT' });
    const next = await media.addMedia(id, 'image', png, 'image/png', 'next.png');
    assert.equal(next.storage_key, `products/${id}/${id}-9.png`);
    assert.equal((await media.listByProduct(id)).length, 8);
  });

  await t.test('concurrent video uploads and replacement retain exactly one row and the fixed video key', async (subtest) => {
    const id = await fixture(subtest);
    const rows = await Promise.all([
      media.addMedia(id, 'spin_video', video, 'video/mp4', 'spin.mp4'),
      media.addMedia(id, 'spin_video', video, 'video/mp4', 'spin-again.mp4'),
    ]);
    assert.equal(rows[0].id, rows[1].id);
    const replacement = Buffer.concat([video, Buffer.alloc(32)]);
    const updated = await media.addMedia(id, 'spin_video', replacement, 'video/mp4', 'replacement.mp4');
    assert.equal(updated.id, rows[0].id);
    assert.equal(updated.storage_key, `spin-videos/${id}.mp4`);
    assert.equal(updated.file_size, replacement.length);
    assert.deepEqual(await readFile(filePath(updated.storage_key)), replacement);
    assert.equal((await media.listByProduct(id)).filter((row) => row.kind === 'spin_video').length, 1);
  });

  await t.test('rejects missing products, path-like IDs, mismatched kinds, spoofed content and oversized files', async () => {
    await assert.rejects(media.addMedia('missing-test-product', 'image', png, 'image/png', 'file.png'), { status: 404 });
    await assert.rejects(media.addMedia('../escape', 'image', png, 'image/png', 'file.png'), { status: 400 });
    await assert.rejects(media.addMedia('test-product', 'image', video, 'video/mp4', 'file.mp4'), { status: 415 });
    await assert.rejects(media.addMedia('test-product', 'spin_video', png, 'image/png', 'file.png'), { status: 415 });
    await assert.rejects(media.addMedia('test-product', 'image', Buffer.from('<html>not an image</html>'), 'image/png', 'fake.png'), { status: 415 });
    await assert.rejects(media.addMedia('test-product', 'image', Buffer.alloc(10 * 1024 * 1024 + 1), 'image/png', 'big.png'), { status: 413 });
    await assert.rejects(media.removeMedia('1 OR 1=1'), { status: 400 });
    await assert.rejects(media.removeMedia('1e2'), { status: 400 });
    await assert.rejects(media.removeMedia('0x10'), { status: 400 });
  });

  await t.test('failed storage upload leaves no media row', async (subtest) => {
    const id = await fixture(subtest);
    const originalUpload = storage.upload;
    storage.upload = async () => { throw new Error('simulated storage failure'); };
    try {
      await assert.rejects(media.addMedia(id, 'image', png, 'image/png', 'file.png'), /simulated storage failure/);
    } finally {
      storage.upload = originalUpload;
    }
    assert.deepEqual(await media.listByProduct(id), []);
  });

  await t.test('failed metadata insert rolls back and cleans the new uploaded file', async (subtest) => {
    const id = await fixture(subtest);
    await pool.query(`CREATE FUNCTION media_test_reject_insert() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'simulated metadata failure'; END; $$;
      CREATE TRIGGER media_test_reject_insert BEFORE INSERT ON product_media
      FOR EACH ROW EXECUTE FUNCTION media_test_reject_insert()`);
    try {
      await assert.rejects(media.addMedia(id, 'image', png, 'image/png', 'file.png'), /simulated metadata failure/);
      assert.deepEqual(await media.listByProduct(id), []);
      await assert.rejects(access(filePath(`products/${id}/${id}-1.png`)), { code: 'ENOENT' });
    } finally {
      await pool.query('DROP TRIGGER media_test_reject_insert ON product_media; DROP FUNCTION media_test_reject_insert()');
    }
    const recovered = await media.addMedia(id, 'image', png, 'image/png', 'file.png');
    assert.equal(recovered.storage_key, `products/${id}/${id}-1.png`);
  });

  await t.test('object deletion failures are logged while metadata is removed', async (subtest) => {
    const id = await fixture(subtest);
    const row = await media.addMedia(id, 'image', png, 'image/png', 'file.png');
    const originalDelete = storage.deleteObject;
    const originalWarn = console.warn;
    const warnings = [];
    storage.deleteObject = async () => { throw new Error('simulated cleanup failure'); };
    console.warn = (...values) => warnings.push(values.join(' '));
    try {
      await media.removeMedia(row.id);
      assert.deepEqual(await media.listByProduct(id), []);
      assert.match(warnings.join(' '), /simulated cleanup failure/);
    } finally {
      storage.deleteObject = originalDelete;
      console.warn = originalWarn;
      await originalDelete(row.storage_key);
    }
    assert.equal(await media.removeMedia(row.id), null);
  });

  await t.test('remove-all deletes only the selected product media', async (subtest) => {
    const selected = await fixture(subtest);
    const other = await fixture(subtest);
    const image = await media.addMedia(selected, 'image', png, 'image/png', 'file.png');
    const spin = await media.addMedia(selected, 'spin_video', video, 'video/mp4', 'spin.mp4');
    await media.addMedia(other, 'image', png, 'image/png', 'other.png');
    assert.equal(await media.removeAllForProduct(selected), 2);
    assert.deepEqual(await media.listByProduct(selected), []);
    assert.equal((await media.listByProduct(other)).length, 1);
    await assert.rejects(access(filePath(image.storage_key)), { code: 'ENOENT' });
    await assert.rejects(access(filePath(spin.storage_key)), { code: 'ENOENT' });
  });

  await t.test('migration down/up removes and recreates the media table and indexes', async () => {
    await pool.query(await readFile(path.join(__dirname, '../migrations/006_add_product_media.down.sql'), 'utf8'));
    assert.equal((await pool.query("SELECT to_regclass('product_media') AS media_table")).rows[0].media_table, null);
    await pool.query(await readFile(path.join(__dirname, '../migrations/006_add_product_media.up.sql'), 'utf8'));
    const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE tablename = 'product_media'");
    assert.ok(indexes.rows.some((row) => row.indexname === 'idx_product_media_product_id'));
    assert.ok(indexes.rows.some((row) => row.indexname === 'idx_product_media_kind'));
  });
});
