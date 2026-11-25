import express from 'express';
import { upload } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * @desc    Upload single or multiple images or PDF documents directly (Admin only)
 * @route   POST /api/upload
 * @access  Protected (Admin only)
 */
router.post('/', requireAdmin, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }

    const files = req.files || (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select one or more PDF documents or images to upload.',
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;

    const uploaded = files.map((file) => {
      const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
      const isImage = /^image\//i.test(file.mimetype);
      return {
        url: fileUrl,
        relativePath: `/uploads/${file.filename}`,
        originalName: file.originalname,
        fileName: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        isImage,
      };
    });

    res.status(201).json({
      success: true,
      message: `${uploaded.length} file(s) uploaded successfully`,
      data: uploaded[0],
      files: uploaded,
    });
  });
});

export default router;
