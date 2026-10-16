const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const upload = require('../src/middleware/upload');

test('multipart parsing accepts allowed files and enforces type, byte and count limits', async (t) => {
  const app = express();
  app.post('/images', upload.array('files', 10), (req, res) => {
    res.json(req.files.map((file) => ({
      name: file.originalname,
      mime: file.mimetype,
      bytes: file.buffer.length,
    })));
  });
  app.post('/video', upload.single('file'), (req, res) => {
    res.json({ mime: req.file.mimetype, bytes: req.file.buffer.length });
  });
  app.use((error, _req, res, _next) => {
    res.status(error.status || 400).json({ code: error.code, error: error.message });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  await t.test('JPEG, PNG and WebP images reach memory storage', async () => {
    const form = new FormData();
    for (const [type, extension] of [['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]) {
      form.append('files', new Blob(['fixture'], { type }), `test.${extension}`);
    }
    const response = await fetch(`${base}/images`, { method: 'POST', body: form });
    assert.equal(response.status, 200);
    const files = await response.json();
    assert.equal(files.length, 3);
    assert.ok(files.every((file) => file.bytes === 7));
  });

  await t.test('a single MP4 is accepted', async () => {
    const form = new FormData();
    form.append('file', new Blob(['video fixture'], { type: 'video/mp4' }), 'spin.mp4');
    const response = await fetch(`${base}/video`, { method: 'POST', body: form });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { mime: 'video/mp4', bytes: 13 });
  });

  await t.test('unsupported MIME type returns a useful error', async () => {
    const form = new FormData();
    form.append('files', new Blob(['fixture'], { type: 'image/svg+xml' }), 'test.svg');
    const response = await fetch(`${base}/images`, { method: 'POST', body: form });
    assert.equal(response.status, 415);
    const error = await response.json();
    assert.equal(error.code, 'UNSUPPORTED_MEDIA_TYPE');
    assert.match(error.error, /JPEG, PNG, WebP/);
  });

  await t.test('files larger than 10 MB are rejected', async () => {
    const form = new FormData();
    form.append('files', new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)], { type: 'image/png' }), 'large.png');
    const response = await fetch(`${base}/images`, { method: 'POST', body: form });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'LIMIT_FILE_SIZE');
  });

  await t.test('an eleventh file is rejected', async () => {
    const form = new FormData();
    for (let index = 0; index < 11; index += 1) {
      form.append('files', new Blob(['fixture'], { type: 'image/png' }), `${index}.png`);
    }
    const response = await fetch(`${base}/images`, { method: 'POST', body: form });
    assert.equal(response.status, 400);
    assert.ok(['LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes((await response.json()).code));
  });

  await t.test('a second video is rejected', async () => {
    const form = new FormData();
    for (let index = 0; index < 2; index += 1) {
      form.append('file', new Blob(['fixture'], { type: 'video/mp4' }), `${index}.mp4`);
    }
    const response = await fetch(`${base}/video`, { method: 'POST', body: form });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'LIMIT_UNEXPECTED_FILE');
  });
});
