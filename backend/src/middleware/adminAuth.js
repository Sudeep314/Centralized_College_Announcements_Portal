import jwt from 'jsonwebtoken';

/**
 * Middleware to protect administrative write endpoints.
 * Requires: Authorization: Bearer <jwt_token>
 */
export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required. Please provide header 'Authorization: Bearer <token>'",
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing from Bearer header',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('FATAL: JWT_SECRET is not configured on the server');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT secret is missing',
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    // Attach decoded admin user payload to request
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' 
        ? 'Authentication token has expired. Please log in again' 
        : 'Invalid or malformed authentication token',
    });
  }
};
