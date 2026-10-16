const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { access, readFile, unlink, rmdir } = require('node:fs/promises');
const path = require('node:path');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const { startBackend } = require('./helpers/backendServer');

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const video = Buffer.concat([Buffer.from([0, 0, 0, 16]), Buffer.from('ftypisom'), Buffer.alloc(4)]);
const diskPath = (key) => path.join(__dirname, '../uploads', key);

test('admin media routes reach the controller through the actual application', {
  skip: process.env.MEDIA_TEST_DATABASE_URL ? false : 'Requires a disposable local media test database',
}, async (t) => {
  const backend = await startBackend(t); // helper rejects remote/non-test databases
  const client = new Client({ connectionString: process.env.MEDIA_TEST_DATABASE_URL });
  await client.connect();
  const ids = [];
  t.after(async () => {
    const { rows } = await client.query('SELECT storage_key FROM product_media WHERE product_id = ANY($1::text[])', [ids]);
    for (const row of rows) await unlink(diskPath(row.storage_key)).catch((e) => { if (e.code !== 'ENOENT') throw e; });
    await client.query('DELETE FROM products WHERE id = ANY($1::text[])', [ids]);
    for (const id of ids) await rmdir(diskPath(`products/${id}`)).catch((e) => { if (e.code !== 'ENOENT') throw e; });
    await client.end();
  });
  const category = (await client.query('SELECT id FROM categories LIMIT 1')).rows[0].id;
  const fixture = async () => {
    const id = `media-http-${randomUUID()}`;
    ids.push(id);
    await client.query('INSERT INTO products (id, category_id, price, en_data, ar_data) VALUES ($1,$2,10,$3,$3)', [id, category, { name: id }]);
    return id;
  };
  const admin = jwt.sign({ id: 1, email: 'test@example.invalid', isAdmin: true }, backend.jwtSecret, { expiresIn: '5m' });
  const customer = jwt.sign({ id: 2, isAdmin: false }, backend.jwtSecret, { expiresIn: '5m' });
  const request = (url, options = {}, token = admin) => fetch(backend.base + url, {
    ...options, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const multipart = (files, field = 'files') => {
    const form = new FormData();
    for (const [bytes, mime] of files) form.append(field, new Blob([bytes], { type: mime }), 'untrusted-file');
    return form;
  };
  const imageUpload = (id, files = [[png, 'image/png']], token = admin) => request(`/api/admin/products/${id}/media/images`, {
    method: 'POST', body: multipart(files),
  }, token);

  await t.test('POST /api/admin/products/<valid-id>/media/images is not shadowed and persists controller output', async () => {
    const id = await fixture();
    const response = await imageUpload(id);
    assert.equal(response.status, 201);
    const { media } = await response.json();
    assert.equal(media.length, 1);
    assert.equal(media[0].product_id, id);
    assert.equal(media[0].kind, 'image');
    assert.equal(media[0].storage_key, `products/${id}/${id}-1.png`);
    assert.equal((await client.query('SELECT id FROM product_media WHERE product_id=$1', [id])).rows[0].id, media[0].id);
    assert.deepEqual(await readFile(diskPath(media[0].storage_key)), png);
    const source = await readFile(path.join(__dirname, '../src/routes/adminRoutes.js'), 'utf8');
    const generic = source.indexOf("router.put('/products/:id'");
    for (const route of ["router.get('/products/:id/media'", "router.post('/products/:id/media/images'", "router.post('/products/:id/media/video'", "router.delete('/products/:id/media/:mediaId'"]) {
      assert.ok(source.indexOf(route) >= 0 && source.indexOf(route) < generic, 'Media route must precede generic product routes');
    }
  });

  await t.test('admin media GET returns full ordered rows only for the requested product', async () => {
    const id = await fixture();
    const other = await fixture();
    const uploaded = await (await imageUpload(id, [[png, 'image/png'], [png, 'image/png']])).json();
    await imageUpload(other);
    const spin = await request(`/api/admin/products/${id}/media/video`, {
      method: 'POST', body: multipart([[video, 'video/mp4']], 'file'),
    });
    assert.equal(spin.status, 201);
    // Exercise the service's explicit ordering rather than insertion order.
    await client.query('UPDATE product_media SET sort_order=5 WHERE id=$1', [uploaded.media[0].id]);
    const response = await request(`/api/admin/products/${id}/media`);
    assert.equal(response.status, 200);
    const body = await response.json();
    const { rows } = await client.query('SELECT * FROM product_media WHERE product_id=$1 ORDER BY kind, sort_order, id', [id]);
    assert.deepEqual(body, { media: JSON.parse(JSON.stringify(rows)) });
    assert.equal(body.media.length, 3);
    assert.equal(body.media[0].id, uploaded.media[1].id);
    assert.ok(body.media.every((row) => row.product_id === id));
    for (const row of body.media) {
      for (const field of ['id', 'product_id', 'kind', 'url', 'mime_type', 'file_size', 'sort_order', 'created_at']) {
        assert.ok(Object.hasOwn(row, field), `Full media row must contain ${field}`);
      }
    }
  });

  await t.test('admin media GET rejects guest, customer and invalid-token access', async () => {
    const id = await fixture();
    await imageUpload(id);
    for (const token of [null, customer, 'invalid-token']) {
      const response = await request(`/api/admin/products/${id}/media`, {}, token);
      assert.equal(response.status, 403);
      assert.equal(Object.hasOwn(await response.json(), 'media'), false);
    }
  });

  await t.test('admin media GET returns 404 for a nonexistent product without exposing another product media', async () => {
    const other = await fixture();
    await imageUpload(other);
    const response = await request(`/api/admin/products/media-http-missing/media`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Product not found' });
  });

  await t.test('admin media GET returns an empty array for an existing product with no media', async () => {
    const id = await fixture();
    const other = await fixture();
    await imageUpload(other);
    // Admins can also edit inactive products; this must not use the public 404 rule.
    await client.query('UPDATE products SET is_active=FALSE WHERE id=$1', [id]);
    const response = await request(`/api/admin/products/${id}/media`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { media: [] });
  });

  await t.test('guests and non-admins cannot upload or delete', async () => {
    const id = await fixture();
    for (const token of [null, customer]) {
      assert.equal((await imageUpload(id, undefined, token)).status, 403);
      assert.equal((await request(`/api/admin/products/${id}/media/1`, { method: 'DELETE' }, token)).status, 403);
    }
    assert.equal((await client.query('SELECT * FROM product_media WHERE product_id=$1', [id])).rowCount, 0);
  });

  await t.test('invalid batches persist nothing and missing products return 404', async () => {
    const id = await fixture();
    assert.equal((await imageUpload(id, [])).status, 400);
    assert.equal((await imageUpload(id, [[png, 'image/png'], [video, 'video/mp4']])).status, 415);
    assert.equal((await imageUpload(id, [[png, 'image/png'], [Buffer.from('fake png'), 'image/png']])).status, 415);
    assert.equal((await imageUpload(id, [[Buffer.from('<svg/>'), 'image/svg+xml']])).status, 415);
    assert.equal((await imageUpload(id, [[Buffer.alloc(10 * 1024 * 1024 + 1), 'image/png']])).status, 413);
    assert.equal((await imageUpload(id, Array.from({ length: 11 }, () => [png, 'image/png']))).status, 400);
    assert.equal((await imageUpload('media-http-missing')).status, 404);
    assert.equal((await client.query('SELECT * FROM product_media WHERE product_id=$1', [id])).rowCount, 0);
  });

  await t.test('video replacement retains one row and rejects image/multiple-file uploads', async () => {
    const id = await fixture();
    const url = `/api/admin/products/${id}/media/video`;
    const first = await request(url, { method: 'POST', body: multipart([[video, 'video/mp4']], 'file') });
    assert.equal(first.status, 201);
    const original = (await first.json()).media;
    const second = await request(url, { method: 'POST', body: multipart([[Buffer.concat([video, Buffer.alloc(8)]), 'video/mp4']], 'file') });
    assert.equal(second.status, 201);
    assert.equal((await second.json()).media.id, original.id);
    assert.equal((await client.query('SELECT * FROM product_media WHERE product_id=$1', [id])).rowCount, 1);
    assert.equal((await request(url, { method: 'POST', body: multipart([[png, 'image/png']], 'file') })).status, 415);
    assert.equal((await request(url, { method: 'POST', body: multipart([[video, 'video/mp4'], [video, 'video/mp4']], 'file') })).status, 400);
  });

  await t.test('a later batch failure removes earlier files and returns a sanitized error', async () => {
    const id = await fixture();
    // The fixture ID is generated here and contains only letters, digits and '-'.
    assert.match(id, /^[a-z0-9-]+$/);
    await client.query(`CREATE FUNCTION media_http_reject_second() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.product_id = '${id}' AND EXISTS (SELECT 1 FROM product_media WHERE product_id = NEW.product_id)
      THEN RAISE EXCEPTION 'private database failure'; END IF; RETURN NEW; END; $$;
      CREATE TRIGGER media_http_reject_second BEFORE INSERT ON product_media
      FOR EACH ROW EXECUTE FUNCTION media_http_reject_second()`);
    try {
      const response = await imageUpload(id, [[png, 'image/png'], [png, 'image/png']]);
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { error: 'Unable to save product media' });
      assert.equal((await client.query('SELECT * FROM product_media WHERE product_id=$1', [id])).rowCount, 0);
      for (const index of [1, 2]) await assert.rejects(access(diskPath(`products/${id}/${id}-${index}.png`)), { code: 'ENOENT' });
    } finally {
      await client.query('DROP TRIGGER media_http_reject_second ON product_media; DROP FUNCTION media_http_reject_second()');
    }
  });

  await t.test('deletion validates ownership and removes only the selected file', async () => {
    const id = await fixture();
    const other = await fixture();
    const { media } = await (await imageUpload(id)).json();
    const route = `/api/admin/products/${id}/media/${media[0].id}`;
    assert.equal((await request(`/api/admin/products/${other}/media/${media[0].id}`, { method: 'DELETE' })).status, 404);
    await access(diskPath(media[0].storage_key));
    assert.equal((await request(route, { method: 'DELETE' })).status, 200);
    await assert.rejects(access(diskPath(media[0].storage_key)), { code: 'ENOENT' });
    assert.equal((await request(route, { method: 'DELETE' })).status, 404);
    assert.equal((await request(`/api/admin/products/${id}/media/1e2`, { method: 'DELETE' })).status, 400);
  });

  await t.test('public and admin product reads opt in to nested media and retain numeric images', async () => {
    const id = await fixture();
    const { media } = await (await imageUpload(id)).json();
    const uploadedVideo = await (await request(`/api/admin/products/${id}/media/video`, {
      method: 'POST', body: multipart([[video, 'video/mp4']], 'file'),
    })).json();
    for (const route of [`/api/products/${id}`, `/api/products?search=${id}`, `/api/admin/products?search=${id}`]) {
      const legacyText = await (await request(route)).text();
      const legacyBody = JSON.parse(legacyText);
      const product = legacyBody.product || legacyBody.products[0];
      assert.equal(typeof product.images, 'number');
      assert.equal(Object.hasOwn(product, 'media'), false);
      assert.deepEqual(Object.keys(product), ['id', 'category', 'price', 'oldPrice', 'badge', 'images', 'spin', 'size',
        'en', 'ar', 'isActive', 'displayOrder', 'mediaBaseUrl', 'videoBaseUrl', 'createdAt', 'updatedAt']);
      const separator = route.includes('?') ? '&' : '?';
      const enriched = await (await request(`${route}${separator}includeMedia=true`)).json();
      const fullProduct = enriched.product || enriched.products[0];
      assert.deepEqual(fullProduct.media, { images: [media[0].url], video: uploadedVideo.media.url });
      const { media: _media, ...unchanged } = fullProduct;
      assert.deepEqual(unchanged, product);
      // Removing only the added object reproduces the original response bytes.
      if (enriched.product) enriched.product = unchanged;
      else enriched.products[0] = unchanged;
      assert.equal(JSON.stringify(enriched), legacyText);
      for (const flag of ['false', 'TRUE', '1', '']) {
        assert.equal(await (await request(`${route}${separator}includeMedia=${flag}`)).text(), legacyText);
      }
    }
    const empty = await fixture();
    assert.deepEqual((await (await request(`/api/products/${empty}?includeMedia=true`)).json()).product.media, { images: [], video: null });
    assert.equal((await request('/api/products/media-http-missing?includeMedia=true')).status, 404);
    assert.equal(await (await request('/api/categories?includeMedia=true')).text(), await (await request('/api/categories')).text());
  });

  await t.test('admin create/update full-product responses follow the same opt-in contract', async () => {
    for (const flag of [false, true]) {
      const id = `media-http-${randomUUID()}`;
      ids.push(id);
      const suffix = flag ? '?includeMedia=true' : '';
      const created = await request(`/api/admin/products${suffix}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, category, price: 12, en: { name: id }, ar: { name: id }, images: 4, includeMedia: true }),
      });
      assert.equal(created.status, 201);
      const product = (await created.json()).product;
      assert.equal(product.images, 4);
      assert.equal(Object.hasOwn(product, 'media'), flag, 'Body fields must not enable media');
      if (flag) assert.deepEqual(product.media, { images: [], video: null });
      const { media } = await (await imageUpload(id)).json();
      const updated = await request(`/api/admin/products/${id}${suffix}`, {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ price: 13 }),
      });
      assert.equal(updated.status, 200);
      const changed = (await updated.json()).product;
      assert.equal(changed.images, 4);
      assert.equal(Object.hasOwn(changed, 'media'), flag);
      if (flag) assert.deepEqual(changed.media, { images: [media[0].url], video: null });
    }
  });
});
