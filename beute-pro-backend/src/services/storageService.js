const { mkdir, writeFile, unlink } = require('node:fs/promises');
const path = require('node:path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const uploadsDirectory = path.resolve(__dirname, '../../uploads');
const useR2 = Boolean(process.env.R2_ACCESS_KEY_ID);
let client;

const validateKey = (key) => {
  if (typeof key !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(key)
    || key.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw Object.assign(new Error('Invalid media storage key'), { status: 400 });
  }
  return key;
};

const r2Configuration = () => {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing R2 configuration: ${missing.join(', ')}`);

  const publicUrl = new URL(process.env.R2_PUBLIC_URL);
  if (!['https:', 'http:'].includes(publicUrl.protocol)
    || publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash) {
    throw new Error('R2_PUBLIC_URL must be an HTTP(S) base URL without credentials or query parameters');
  }
  return {
    bucket: process.env.R2_BUCKET_NAME,
    publicUrl: publicUrl.href.replace(/\/+$/, ''),
  };
};

const r2Client = () => {
  r2Configuration();
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
  }
  return client;
};

const upload = async (buffer, key, contentType) => {
  validateKey(key);
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw Object.assign(new Error('The uploaded file is empty'), { status: 400 });
  }
  if (useR2) {
    const { bucket } = r2Configuration();
    await r2Client().send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Video replacement deliberately keeps the same key; require revalidation.
      CacheControl: 'public, max-age=0, must-revalidate',
    }));
    return;
  }
  const destination = path.join(uploadsDirectory, key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer);
};

const deleteObject = async (key) => {
  validateKey(key);
  if (useR2) {
    const { bucket } = r2Configuration();
    await r2Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }
  try {
    await unlink(path.join(uploadsDirectory, key));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

const getPublicUrl = (key) => {
  validateKey(key);
  return useR2 ? `${r2Configuration().publicUrl}/${key}` : `/uploads/${key}`;
};

module.exports = { upload, deleteObject, getPublicUrl };
