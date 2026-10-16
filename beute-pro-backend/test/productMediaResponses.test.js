const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { access, rmdir } = require('node:fs/promises');
const path = require('node:path');

test('product services preserve legacy data and opt in to nested media', {
  skip: process.env.MEDIA_TEST_DATABASE_URL ? false : 'Requires a disposable local media test database',
}, async (t) => {
  const database = new URL(process.env.MEDIA_TEST_DATABASE_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(database.hostname));
  assert.equal(database.pathname, '/beute_media_test');
  process.env.DATABASE_URL = database.href;
  process.env.R2_ACCESS_KEY_ID = '';
  const pool = require('../src/config/db');
  const products = require('../src/services/productService');
  const media = require('../src/services/productMediaService');
  const ids = [];
  t.after(async () => {
    for (const id of ids) {
      if (await products.getById(id)) await products.remove(id, true);
      await rmdir(path.join(__dirname, '../uploads/products', id)).catch((e) => { if (e.code !== 'ENOENT') throw e; });
    }
    await pool.end();
  });
  const category = (await pool.query('SELECT id FROM categories LIMIT 1')).rows[0].id;
  const fixture = async (includeMedia = false) => {
    const id = `media-response-${randomUUID()}`;
    ids.push(id);
    return products.create({ id, category, price: 10, en: { name: id }, ar: { name: id }, images: 7,
      mediaBaseUrl: '/legacy/images', videoBaseUrl: '/legacy/video' }, { includeMedia });
  };
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  const video = Buffer.concat([Buffer.from([0, 0, 0, 16]), Buffer.from('ftypisom'), Buffer.alloc(4)]);

  await t.test('getAll/getById opt-in adds ordered media without changing any legacy field', async () => {
    const original = await fixture();
    assert.equal(Object.hasOwn(original, 'media'), false);
    const later = await media.addMedia(original.id, 'image', png, 'image/png', 'later.png', 9);
    const first = await media.addMedia(original.id, 'image', png, 'image/png', 'first.png', 0);
    const spin = await media.addMedia(original.id, 'spin_video', video, 'video/mp4', 'spin.mp4');
    assert.equal(JSON.stringify(await products.getById(original.id)), JSON.stringify(original));
    const included = await products.getById(original.id, { includeMedia: true });
    assert.deepEqual(included.media, { images: [first.url, later.url], video: spin.url });
    const { media: _media, ...legacy } = included;
    assert.deepEqual(legacy, original);
    assert.equal(included.images, 7);
    assert.equal(included.mediaBaseUrl, '/legacy/images');
    assert.equal(included.videoBaseUrl, '/legacy/video');
    const list = await products.getAll({ search: original.id, includeMedia: true });
    assert.deepEqual(list.products[0].media, included.media);
    assert.equal(Object.hasOwn((await products.getAll({ search: original.id })).products[0], 'media'), false);
    const row = (await pool.query('SELECT images_count, media_base_url, video_base_url FROM products WHERE id=$1', [original.id])).rows[0];
    assert.deepEqual(row, { images_count: 7, media_base_url: '/legacy/images', video_base_url: '/legacy/video' });
  });

  await t.test('empty media, create/update opt-in and missing products have stable shapes', async () => {
    const original = await fixture(true);
    assert.deepEqual(original.media, { images: [], video: null });
    assert.equal(original.images, 7);
    assert.deepEqual((await products.update(original.id, { price: 11 }, { includeMedia: true })).media, original.media);
    assert.equal(Object.hasOwn(await products.update(original.id, { price: 12 }), 'media'), false);
    assert.equal(await products.getById('media-response-missing', { includeMedia: true }), null);
    assert.deepEqual((await products.getAll({ search: 'media-response-missing', includeMedia: true })).products, []);
  });

  for (const hard of [false, true]) {
    await t.test(`${hard ? 'hard' : 'soft'} product deletion removes media objects and metadata`, async () => {
      const product = await fixture();
      const image = await media.addMedia(product.id, 'image', png, 'image/png', 'image.png');
      const spin = await media.addMedia(product.id, 'spin_video', video, 'video/mp4', 'video.mp4');
      assert.equal(await products.remove(product.id, hard), true);
      assert.deepEqual(await media.listByProduct(product.id), []);
      for (const row of [image, spin]) await assert.rejects(access(path.join(__dirname, '../uploads', row.storage_key)), { code: 'ENOENT' });
      const remaining = await products.getById(product.id, { includeMedia: true });
      if (hard) assert.equal(remaining, null);
      else {
        assert.equal(remaining.isActive, false);
        assert.equal(remaining.images, 7);
        assert.deepEqual(remaining.media, { images: [], video: null });
      }
    });
  }
  await t.test('deleting an unknown product keeps the existing false result', async () => {
    assert.equal(await products.remove('media-response-missing'), false);
    assert.equal(await products.remove('media-response-missing', true), false);
  });

  await t.test('legacy product IDs remain deletable even when unsuitable for new upload keys', async () => {
    const id = `legacy.media.${randomUUID()}`;
    ids.push(id);
    await products.create({ id, category, price: 10, en: { name: id }, ar: { name: id } });
    assert.equal(await products.remove(id), true);
    assert.equal(await products.remove(id, true), true);
  });
});
