import express from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import {
  createAnnouncementValidator,
  updateAnnouncementValidator,
  validateAnnouncementId,
} from '../validators/announcementValidator.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * Public Routes
 */
// GET /api/announcements - list with search, filter, sort, pagination
router.get('/', getAnnouncements);

// GET /api/announcements/:id - get single announcement
router.get('/:id', validateAnnouncementId, getAnnouncementById);

/**
 * Protected Routes (Require Admin Bearer Token)
 */
// POST /api/announcements - create announcement
router.post('/', requireAdmin, createAnnouncementValidator, createAnnouncement);

// PUT /api/announcements/:id - update announcement
router.put('/:id', requireAdmin, updateAnnouncementValidator, updateAnnouncement);

// DELETE /api/announcements/:id - delete announcement
router.delete('/:id', requireAdmin, validateAnnouncementId, deleteAnnouncement);

export default router;
