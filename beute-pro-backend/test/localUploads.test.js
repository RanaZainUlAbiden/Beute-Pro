const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdir, writeFile, unlink, rmdir } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { startBackend } = require('./helpers/backendServer');

test('the actual backend serves local uploads only when R2 is absent', {
  skip: process.env.MEDIA_TEST_DATABASE_URL ? false : 'Requires a disposable local media test database',
}, async (t) => {
  const id = `static-test-${randomUUID()}`;
  const directory = path.join(__dirname, '../uploads/products', id);
  const file = path.join(directory, `${id}-1.png`);
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  await mkdir(directory, { recursive: true });
  await writeFile(file, bytes);
  t.after(async () => { await unlink(file); await rmdir(directory); });
  const url = `/uploads/products/${id}/${id}-1.png`;

  await t.test('local mode serves the exact bytes with image content type', async (subtest) => {
    const backend = await startBackend(subtest);
    const response = await fetch(backend.base + url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^image\/png/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  });

  await t.test('R2 mode does not expose the uploads directory', async (subtest) => {
    const backend = await startBackend(subtest, { R2_ACCESS_KEY_ID: 'fake-test-key-never-used' });
    const response = await fetch(backend.base + url);
    assert.equal(response.status, 404);
  });
});
