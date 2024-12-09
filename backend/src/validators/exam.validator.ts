import { body, query, param } from 'express-validator';

export const validateExam = {
  getExams: [
    query('term').optional().isInt({ min: 1, max: 3 })
      .withMessage('Term must be between 1 and 3'),
    query('year').optional().isInt({ min: 2000, max: new Date().getFullYear() + 5 })
      .withMessage('Invalid year'),
    query('status').optional().isIn(['active', 'archived'])
      .withMessage('Status must be either active or archived'),
    query('classId').optional().isUUID()
      .withMessage('Invalid class ID')
  ],

  getExamById: [
    param('id').isUUID()
      .withMessage('Invalid exam ID')
  ],

  createExam: [
    body('name').trim().notEmpty()
      .withMessage('Exam name is required'),
    body('term').isInt({ min: 1, max: 3 })
      .withMessage('Term must be between 1 and 3'),
    body('year').isInt({ min: 2000, max: new Date().getFullYear() + 5 })
      .withMessage('Invalid year'),
    body('classId').isUUID()
      .withMessage('Invalid class ID')
  ],

  updateExamStatus: [
    param('id').isUUID()
      .withMessage('Invalid exam ID'),
    body('status').isIn(['active', 'archived'])
      .withMessage('Status must be either active or archived')
  ],

  deleteExam: [
    param('id').isUUID()
      .withMessage('Invalid exam ID')
  ],

  getExamStats: [
    param('id').isUUID()
      .withMessage('Invalid exam ID')
  ]
};
