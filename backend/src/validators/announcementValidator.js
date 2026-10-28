import { body, param, validationResult } from 'express-validator';

const ALLOWED_CATEGORIES = ['Academics', 'Examinations', 'Events', 'General'];

/**
 * Middleware that inspects express-validator validation results
 * and immediately sends a formatted 400 Bad Request error if validation failed.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: Please check your input fields',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for creating a new announcement (POST /api/announcements)
 */
export const createAnnouncementValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title must not exceed 150 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 3000 })
    .withMessage('Description must not exceed 3000 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(ALLOWED_CATEGORIES)
    .withMessage(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`),

  body('publishedAt')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('publishedAt must be a valid ISO 8601 date string'),

  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('deadline must be a valid ISO 8601 date string'),

  body('sourceUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('sourceUrl must be a valid URL starting with http:// or https://'),

  body('attachmentUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('attachmentUrl must be a valid URL starting with http:// or https://'),

  body('pinned')
    .optional()
    .isBoolean()
    .withMessage('pinned must be a boolean value (true or false)')
    .toBoolean(),

  handleValidationErrors,
];

/**
 * Validation rules for updating an existing announcement (PUT /api/announcements/:id)
 */
export const updateAnnouncementValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid announcement ID format. Must be a 24-character hexadecimal MongoDB ObjectId'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Title must not exceed 150 characters'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ max: 3000 })
    .withMessage('Description must not exceed 3000 characters'),

  body('category')
    .optional()
    .trim()
    .isIn(ALLOWED_CATEGORIES)
    .withMessage(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`),

  body('publishedAt')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('publishedAt must be a valid ISO 8601 date string'),

  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('deadline must be a valid ISO 8601 date string'),

  body('sourceUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('sourceUrl must be a valid URL starting with http:// or https://'),

  body('attachmentUrl')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('attachmentUrl must be a valid URL starting with http:// or https://'),

  body('pinned')
    .optional()
    .isBoolean()
    .withMessage('pinned must be a boolean value (true or false)')
    .toBoolean(),

  handleValidationErrors,
];

/**
 * Validation rules for routes with :id parameter (GET /api/announcements/:id, DELETE /api/announcements/:id)
 */
export const validateAnnouncementId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid announcement ID format. Must be a 24-character hexadecimal MongoDB ObjectId'),
  handleValidationErrors,
];
