'use strict';
const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// Ensure uploads directory exists at server startup
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg\+xml|svg/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase().replace('.', ''));
    const mimeOk = /image\//.test(file.mimetype);
    if (extOk || mimeOk) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

/**
 * POST /api/upload
 * Accepts a multipart/form-data request with a single `file` field.
 * Returns { success: true, url: "https://..." }
 */
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const siteUrl = (process.env.SITE_URL || 'http://localhost:3001').replace(/\/$/, '');
  const publicUrl = `${siteUrl}/uploads/${req.file.filename}`;
  return res.json({ success: true, url: publicUrl, filename: req.file.filename });
});

// Error handler for multer errors (file size, wrong type, etc.)
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Upload failed' });
});

module.exports = router;
