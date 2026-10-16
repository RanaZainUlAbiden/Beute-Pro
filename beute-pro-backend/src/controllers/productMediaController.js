const mediaService = require('../services/productMediaService');
const productService = require('../services/productService');

const listMedia = async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const media = await mediaService.listByProduct(req.params.id);
    res.json({ media });
  } catch (error) { next(error); }
};

const uploadImages = async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'Select at least one image' });
    // Validate the entire request before persisting any file in a mixed batch.
    for (const file of req.files) mediaService.validateFile('image', file.buffer, file.mimetype);
    const media = [];
    try {
      for (const file of req.files) {
        media.push(await mediaService.addMedia(req.params.id, 'image', file.buffer, file.mimetype, file.originalname));
      }
    } catch (error) {
      // Compensate earlier files if a later upload in this request fails.
      for (const row of media) {
        try { await mediaService.removeMedia(row.id); }
        catch (cleanupError) { console.warn('Upload batch cleanup failed:', row.id, cleanupError.message); }
      }
      throw error;
    }
    res.status(201).json({ media });
  } catch (error) { next(error); }
};

const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Select one MP4 video' });
    const media = await mediaService.addMedia(req.params.id, 'spin_video', req.file.buffer, req.file.mimetype, req.file.originalname);
    res.status(201).json({ media });
  } catch (error) { next(error); }
};

const deleteMedia = async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.mediaId)) return res.status(400).json({ error: 'Invalid media ID' });
    const rows = await mediaService.listByProduct(req.params.id);
    if (!rows.some((row) => String(row.id) === req.params.mediaId)) {
      return res.status(404).json({ error: 'Media not found for this product' });
    }
    const removed = await mediaService.removeMedia(req.params.mediaId);
    if (!removed) return res.status(404).json({ error: 'Media not found for this product' });
    res.json({ success: true });
  } catch (error) { next(error); }
};

// Route-local handling keeps multipart limits and service validation out of the
// generic 500 handler without changing errors on existing application routes.
const handleError = (error, _req, res, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Each file must be 10 MB or smaller' });
  if (error.name === 'MulterError') return res.status(400).json({ error: 'Invalid multipart upload or too many files' });
  if ([400, 404, 413, 415].includes(error.status)) return res.status(error.status).json({ error: error.message });
  console.error('Product media error:', error.message);
  res.status(500).json({ error: 'Unable to save product media' });
};

module.exports = { listMedia, uploadImages, uploadVideo, deleteMedia, handleError };
