const pool = require('../config/db');
const storage = require('./storageService');

const extensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
};
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

const validateProductId = (id) => {
  if (typeof id !== 'string' || id.length > 100 || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) {
    throw fail('Invalid product ID for media storage');
  }
};

const validateFile = (kind, buffer, mimeType, sortOrder) => {
  if (!['image', 'spin_video'].includes(kind)
    || !extensions[mimeType]
    || (kind === 'image' && !mimeType.startsWith('image/'))
    || (kind === 'spin_video' && mimeType !== 'video/mp4')) {
    throw fail('Use JPEG, PNG or WebP for images and MP4 for the spin video', 415);
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw fail('The uploaded file is empty');
  if (buffer.length > 10 * 1024 * 1024) throw fail('Each file must be 10 MB or smaller', 413);
  if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 2147483647)) {
    throw fail('Image sort order must be a non-negative integer');
  }
  const matches = {
    'image/jpeg': () => buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': () => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/webp': () => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
    'video/mp4': () => buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp',
  };
  if (!matches[mimeType]()) throw fail('The file content does not match its declared media type', 415);
};

const listByProduct = async (productId) => {
  validateProductId(productId);
  const { rows } = await pool.query(
    'SELECT * FROM product_media WHERE product_id = $1 ORDER BY kind, sort_order, id',
    [productId]
  );
  return rows;
};

const lockProduct = async (client, productId) => {
  const { rowCount } = await client.query('SELECT id FROM products WHERE id = $1 FOR UPDATE', [productId]);
  if (!rowCount) throw fail('Product not found', 404);
};

const rollback = async (client) => {
  try { await client.query('ROLLBACK'); }
  catch (error) { console.error('Media transaction rollback failed:', error.message); }
};

const tryDeleteObject = async (key) => {
  try { await storage.deleteObject(key); }
  catch (error) { console.warn('Media object cleanup failed:', key, error.message); }
};

const addMedia = async (productId, kind, buffer, mimeType, _originalName, sortOrder) => {
  validateProductId(productId);
  validateFile(kind, buffer, mimeType, sortOrder);
  const client = await pool.connect();
  let key;
  let uploaded = false;
  let replacingVideo = false;
  let committing = false;
  try {
    await client.query('BEGIN');
    // Serialize numbering, replacement and deletion for a product across replicas.
    await lockProduct(client, productId);
    const existing = await client.query('SELECT * FROM product_media WHERE product_id = $1', [productId]);
    const video = existing.rows.find((row) => row.kind === 'spin_video');
    replacingVideo = kind === 'spin_video' && Boolean(video);
    const images = existing.rows.filter((row) => row.kind === 'image');
    const nextIndex = images.reduce((highest, row) => {
      const match = row.storage_key.match(/-(\d+)\.(?:webp|png|jpg)$/);
      return Math.max(highest, match ? Number(match[1]) : 0);
    }, 0) + 1;
    const nextSortOrder = images.reduce((highest, row) => Math.max(highest, row.sort_order), -1) + 1;
    key = kind === 'image'
      ? `products/${productId}/${productId}-${nextIndex}.${extensions[mimeType]}`
      : `spin-videos/${productId}.mp4`;
    const url = storage.getPublicUrl(key);
    await storage.upload(buffer, key, mimeType);
    uploaded = true;
    let result;
    if (replacingVideo) {
      result = await client.query(
        `UPDATE product_media SET url = $2, storage_key = $3, mime_type = $4,
         file_size = $5, sort_order = $6 WHERE id = $1 RETURNING *`,
        [video.id, url, key, mimeType, buffer.length, sortOrder ?? 0]
      );
    } else {
      result = await client.query(
        `INSERT INTO product_media
         (product_id, kind, url, storage_key, mime_type, file_size, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [productId, kind, url, key, mimeType, buffer.length, sortOrder ?? (kind === 'image' ? nextSortOrder : 0)]
      );
    }
    committing = true;
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    // Keep the product lock while compensating a failed new upload. A fixed-key
    // video replacement must never be deleted: the previous row still uses it.
    // A failed COMMIT can be ambiguous, so do not delete a possibly committed file.
    if (uploaded && !replacingVideo && !committing) await tryDeleteObject(key);
    await rollback(client);
    throw error;
  } finally {
    client.release();
  }
};

const removeMedia = async (mediaId) => {
  const id = Number(mediaId);
  if (!/^\d+$/.test(String(mediaId)) || !Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
    throw fail('Invalid media ID');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const initial = await client.query('SELECT product_id FROM product_media WHERE id = $1', [id]);
    if (!initial.rowCount) {
      await client.query('COMMIT');
      return null;
    }
    await lockProduct(client, initial.rows[0].product_id);
    const result = await client.query('DELETE FROM product_media WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount) await tryDeleteObject(result.rows[0].storage_key);
    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    await rollback(client);
    throw error;
  } finally {
    client.release();
  }
};

const removeAllForProduct = async (productId, { client: transactionClient } = {}) => {
  // Legacy catalog IDs need not meet the stricter object-key rules for new
  // uploads. SQL parameters and stored-key validation keep cleanup safe.
  if (typeof productId !== 'string' || !productId.length || productId.length > 100) throw fail('Invalid product ID');
  const client = transactionClient || await pool.connect();
  try {
    if (!transactionClient) await client.query('BEGIN');
    await lockProduct(client, productId);
    const { rows } = await client.query('DELETE FROM product_media WHERE product_id = $1 RETURNING *', [productId]);
    for (const row of rows) await tryDeleteObject(row.storage_key);
    if (!transactionClient) await client.query('COMMIT');
    return rows.length;
  } catch (error) {
    if (!transactionClient) await rollback(client);
    throw error;
  } finally {
    if (!transactionClient) client.release();
  }
};

module.exports = { listByProduct, addMedia, removeMedia, removeAllForProduct, validateFile };
