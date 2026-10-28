import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * @desc    Authenticate admin and return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!expectedUsername || !expectedPasswordHash || !jwtSecret) {
      console.error('FATAL: Admin authentication environment variables are not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: Authentication is not configured',
      });
    }

    // Verify username (case-insensitive for convenience in classroom demo)
    if (username.trim().toLowerCase() !== expectedUsername.trim().toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Verify password against stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, expectedPasswordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Generate JWT token with 24 hours expiry
    const token = jwt.sign(
      {
        username: expectedUsername,
        role: 'admin',
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully',
      data: {
        token,
        tokenType: 'Bearer',
        expiresIn: '24h',
        user: {
          username: expectedUsername,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
