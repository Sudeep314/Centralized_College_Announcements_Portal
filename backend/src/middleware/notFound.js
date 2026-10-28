/**
 * Middleware to catch requests made to non-existent API routes (404)
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
};
