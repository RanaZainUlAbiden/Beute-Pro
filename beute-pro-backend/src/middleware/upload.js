const multer = require('multer');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4']);

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
    fields: 10,
    parts: 20,
    fieldSize: 1024,
  },
  fileFilter: (_req, file, callback) => {
    // Keep this synchronous so the file-size limit is active immediately.
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Unsupported file type. Upload a JPEG, PNG, WebP image or an MP4 video.');
      error.status = 415;
      error.code = 'UNSUPPORTED_MEDIA_TYPE';
      return callback(error);
    }
    callback(null, true);
  },
});
