const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const { auth } = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// POST /api/upload - base64 or URL upload
router.post('/', auth, async (req, res) => {
  const { data, folder } = req.body; // data = base64 string or URL
  if (!data) return res.status(400).json({ message: 'No image data provided' });
  try {
    const result = await cloudinary.uploader.upload(data, {
      folder: folder || 'star-crumbs',
      resource_type: 'auto',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    });
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (e) {
    console.error('Cloudinary error:', e);
    res.status(500).json({ message: 'Upload failed', error: e.message });
  }
});

// DELETE /api/upload/:publicId
router.delete('/:publicId', auth, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(decodeURIComponent(req.params.publicId));
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;
