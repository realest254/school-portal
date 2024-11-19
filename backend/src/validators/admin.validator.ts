import { body, param, query } from 'express-validator';
import { UserRole } from '../middlewares/auth.middleware';

export const teacherValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('employeeId')
      .trim()
      .notEmpty()
      .withMessage('Employee ID is required')
      .isLength({ max: 50 })
      .withMessage('Employee ID must be at most 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ max: 100 })
      .withMessage('Subject must be at most 100 characters'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be 10 digits'),
    body('joinDate')
      .trim()
      .notEmpty()
      .withMessage('Join date is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Join date must be in YYYY-MM-DD format')
  ],
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Name must be at most 100 characters'),
    body('employeeId')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Employee ID must be at most 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Subject must be at most 100 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^\d{10}$/)
      .withMessage('Phone number must be 10 digits'),
    body('joinDate')
      .optional()
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Join date must be in YYYY-MM-DD format'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Status must be either active or inactive')
  ]
};

export const studentValidation = {
  getAll: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
    query('search').optional().isString().withMessage('Search must be a string')
  ],
  getById: [
    param('id').isUUID().withMessage('Valid student ID is required')
  ],
  create: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('grade').isInt({ min: 1, max: 12 }).withMessage('Valid grade is required'),
    body('section').notEmpty().withMessage('Section is required'),
    body('guardianPhone').isMobilePhone('any').withMessage('Valid guardian phone is required'),
    body('address').optional().isString().withMessage('Address must be a string')
  ],
  update: [
    param('id').isUUID().withMessage('Valid student ID is required'),
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('grade').optional().isInt({ min: 1, max: 12 }).withMessage('Valid grade is required'),
    body('section').optional().notEmpty().withMessage('Section cannot be empty'),
    body('guardianPhone').optional().isMobilePhone('any').withMessage('Valid guardian phone is required'),
    body('address').optional().isString().withMessage('Address must be a string'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
  ],
  delete: [
    param('id').isUUID().withMessage('Valid student ID is required')
  ]
};

export const statsValidation = {
  getStats: [
    query('startDate').optional().isDate().withMessage('Valid start date is required'),
    query('endDate').optional().isDate().withMessage('Valid end date is required')
  ]
};

export const notificationValidation = {
  validateCreate: [
    body('title').isString().trim().notEmpty().withMessage('Title is required'),
    body('message').isString().trim().notEmpty().withMessage('Message is required'),
    body('priority')
      .isIn(['high', 'medium', 'low'])
      .withMessage('Priority must be high, medium, or low'),
    body('target_audience')
      .isArray()
      .withMessage('Target audience must be an array')
      .custom((value: string[]) => {
        const validRoles = Object.values(UserRole);
        return value.every(role => validRoles.includes(role as UserRole));
      })
      .withMessage('Invalid target audience roles'),
    body('expires_at')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid date')
  ],

  validateUpdate: [
    param('id').isUUID().withMessage('Invalid notification ID'),
    body('title').optional().isString().trim(),
    body('message').optional().isString().trim(),
    body('priority')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('Priority must be high, medium, or low'),
    body('target_audience')
      .optional()
      .isArray()
      .withMessage('Target audience must be an array')
      .custom((value: string[]) => {
        const validRoles = Object.values(UserRole);
        return value.every(role => validRoles.includes(role as UserRole));
      })
      .withMessage('Invalid target audience roles'),
    body('expires_at')
      .optional()
      .isISO8601()
      .withMessage('Expiry date must be a valid date'),
    body('status')
      .optional()
      .isIn(['active', 'expired', 'deleted'])
      .withMessage('Invalid status')
  ],

  validateGetAll: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('priority').optional().isIn(['high', 'medium', 'low']),
    query('status').optional().isIn(['active', 'expired', 'deleted']),
    query('target_audience')
      .optional()
      .custom((value: string) => {
        return Object.values(UserRole).includes(value as UserRole);
      })
      .withMessage('Invalid target audience'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],

  validateGetById: [
    param('id').isUUID().withMessage('Invalid notification ID')
  ],

  validateDelete: [
    param('id').isUUID().withMessage('Invalid notification ID')
  ],

  validateGetForRecipient: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ]
};
