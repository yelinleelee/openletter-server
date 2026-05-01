const express = require('express');
const { Readable } = require('stream');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const upload = require('../middlewares/upload');
const authMiddleware = require('../middlewares/auth');

function toStream(buffer) {
  const s = new Readable();
  s.push(buffer);
  s.push(null);
  return s;
}

function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'openletter/stays',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    toStream(buffer).pipe(stream);
  });
}

// POST /api/upload/image — 단일 이미지
router.post('/image', authMiddleware, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: '이미지를 선택해주세요' });

    const result = await uploadToCloudinary(req.file.buffer);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/images — 다중 이미지 (최대 10장)
router.post('/images', authMiddleware, upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: '이미지를 선택해주세요' });

    const results = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer))
    );

    res.json({
      images: results.map(r => ({
        url: r.secure_url,
        publicId: r.public_id,
        width: r.width,
        height: r.height,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/upload/image — 이미지 삭제
router.delete('/image', authMiddleware, async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ error: 'publicId가 필요합니다' });

    await cloudinary.uploader.destroy(publicId);
    res.json({ message: '이미지가 삭제되었습니다' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
