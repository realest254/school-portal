import { body, query, param } from 'express-validator';

export const notificationValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message must be at most 1000 characters'),
    
    body('type')
      .isIn(['info', 'warning', 'success', 'error'])
      .withMessage('Invalid notification type'),
    
    body('recipientType')
      .isIn(['all', 'teachers', 'students', 'parents'])
      .withMessage('Invalid recipient type'),
    
    body('recipientIds')
      .optional()
      .isArray()
      .withMessage('Recipient IDs must be an array'),
    
    body('recipientIds.*')
      .optional()
      .isString()
      .withMessage('Each recipient ID must be a string'),
    
    body('scheduledFor')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format for scheduledFor')
      .custom((value) => {
        if (value && new Date(value) < new Date()) {
          throw new Error('Scheduled date must be in the future');
        }
        return true;
      })
  ],

  update: [
    param('id')
      .isUUID()
      .withMessage('Invalid notification ID'),
    
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),
    
    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Message must be at most 1000 characters'),
    
    body('type')
      .optional()
      .isIn(['info', 'warning', 'success', 'error'])
      .withMessage('Invalid notification type'),
    
    body('status')
      .optional()
      .isIn(['sent', 'pending', 'failed'])
      .withMessage('Invalid status'),
    
    body('scheduledFor')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format for scheduledFor')
      .custom((value) => {
        if (value && new Date(value) < new Date()) {
          throw new Error('Scheduled date must be in the future');
        }
        return true;
      })
  ],

  getAll: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('type')
      .optional()
      .isIn(['info', 'warning', 'success', 'error'])
      .withMessage('Invalid notification type'),
    
    query('recipientType')
      .optional()
      .isIn(['all', 'teachers', 'students', 'parents'])
      .withMessage('Invalid recipient type'),
    
    query('status')
      .optional()
      .isIn(['sent', 'pending', 'failed'])
      .withMessage('Invalid status'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
      .custom((endDate, { req }) => {
        if (endDate && req.query.startDate && new Date(endDate) < new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ],

  getById: [
    param('id')
      .isUUID()
      .withMessage('Invalid notification ID')
  ],

  delete: [
    param('id')
      .isUUID()
      .withMessage('Invalid notification ID')
  ],

  send: [
    param('id')
      .isUUID()
      .withMessage('Invalid notification ID')
  ],

  getForRecipient: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    param('recipientId')
      .optional()
      .isUUID()
      .withMessage('Invalid recipient ID')
  ]
};
