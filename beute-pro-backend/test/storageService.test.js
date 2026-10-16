const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFile, access, rmdir } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { S3Client } = require('@aws-sdk/client-s3');

const modulePath = require.resolve('../src/services/storageService');
const variables = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];

const loadStorage = (t, environment = {}) => {
  const saved = Object.fromEntries(variables.map((key) => [key, process.env[key]]));
  for (const key of variables) {
    if (environment[key] === undefined) delete process.env[key];
    else process.env[key] = environment[key];
  }
  delete require.cache[modulePath];
  t.after(() => {
    for (const key of variables) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    delete require.cache[modulePath];
  });
  return require(modulePath);
};

test('local storage round-trips bytes and deletes only the requested key', async (t) => {
  const storage = loadStorage(t);
  const product = `storage-test-${randomUUID()}`;
  const key = `products/${product}/${product}-1.webp`;
  const file = path.join(__dirname, '../uploads', key);
  t.after(async () => {
    await storage.deleteObject(key);
    await rmdir(path.dirname(file));
  });
  const buffer = Buffer.from('local storage fixture');
  await storage.upload(buffer, key, 'image/webp');
  assert.deepEqual(await readFile(file), buffer);
  assert.equal(storage.getPublicUrl(key), `/uploads/${key}`);
  await storage.deleteObject(key);
  await assert.rejects(access(file), { code: 'ENOENT' });
  await storage.deleteObject(key); // deleting an absent object is idempotent
});

test('local storage rejects path traversal and invalid keys', async (t) => {
  const storage = loadStorage(t);
  for (const key of ['../.env', '/absolute.webp', 'C:/secret', 'products/../secret',
    'products\\secret.webp', 'products//secret.webp', 'products/%2e%2e/secret', 'products/']) {
    await assert.rejects(storage.upload(Buffer.from('fixture'), key, 'image/webp'), /Invalid media storage key/);
    await assert.rejects(storage.deleteObject(key), /Invalid media storage key/);
    assert.throws(() => storage.getPublicUrl(key), /Invalid media storage key/);
  }
  await assert.rejects(storage.upload(Buffer.alloc(0), 'products/empty.webp', 'image/webp'), /empty/);
});

test('R2 mode sends typed S3 commands and produces the public CDN URL without network access', async (t) => {
  const storage = loadStorage(t, {
    R2_ACCOUNT_ID: '00000000000000000000000000000000',
    R2_ACCESS_KEY_ID: 'test-key',
    R2_SECRET_ACCESS_KEY: 'test-secret',
    R2_BUCKET_NAME: 'test-bucket',
    R2_PUBLIC_URL: 'https://cdn.example.test/',
  });
  const commands = [];
  const originalSend = S3Client.prototype.send;
  S3Client.prototype.send = async function (command) {
    assert.equal(await this.config.region(), 'auto');
    commands.push(command);
    return {};
  };
  t.after(() => { S3Client.prototype.send = originalSend; });
  const key = 'products/almond-oil/almond-oil-1.webp';
  const buffer = Buffer.from('R2 fixture');
  await storage.upload(buffer, key, 'image/webp');
  await storage.deleteObject(key);
  assert.equal(commands[0].constructor.name, 'PutObjectCommand');
  assert.equal(commands[0].input.Bucket, 'test-bucket');
  assert.equal(commands[0].input.Key, key);
  assert.deepEqual(commands[0].input.Body, buffer);
  assert.equal(commands[0].input.ContentType, 'image/webp');
  assert.equal(commands[1].constructor.name, 'DeleteObjectCommand');
  assert.equal(commands[1].input.Key, key);
  assert.equal(storage.getPublicUrl(key), `https://cdn.example.test/${key}`);
});

test('partial R2 configuration fails instead of silently writing to disk', async (t) => {
  const storage = loadStorage(t, { R2_ACCESS_KEY_ID: 'test-key' });
  await assert.rejects(storage.upload(Buffer.from('fixture'), 'products/test.webp', 'image/webp'), /Missing R2 configuration/);
  assert.throws(() => storage.getPublicUrl('products/test.webp'), /Missing R2 configuration/);
});
