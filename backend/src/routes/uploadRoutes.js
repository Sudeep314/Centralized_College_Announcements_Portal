import express from 'express';
import { upload } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * @desc    Upload an image or document directly (Admin only)
 * @route   POST /api/upload
 * @access  Protected (Admin only)
 */
router.post('/', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image or document to upload.',
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    const isImage = /^image\//i.test(req.file.mimetype);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        relativePath: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        isImage,
      },
    });
  });
});

export default router;
