import express from 'express';
import { loginAdmin } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin and return JWT
 * @access  Public
 */
router.post('/login', loginAdmin);

export default router;
