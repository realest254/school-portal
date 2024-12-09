import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { ExamController } from '../controllers/exam.controller';
import { validateExam } from '../validators/exam.validator';

const router = express.Router();

// Apply auth middleware to all exam routes
router.use(verifyToken);

// Get all exams
router.get(
  '/',
  requireRole(['teacher', 'admin']),
  validateExam.getExams,
  ExamController.getAllExams
);

// Get exam by ID
router.get(
  '/:id',
  requireRole(['teacher', 'admin']),
  validateExam.getExamById,
  ExamController.getExamById
);

// Create new exam
router.post(
  '/',
  requireRole(['teacher', 'admin']),
  validateExam.createExam,
  ExamController.createExam
);

// Update exam status
router.patch(
  '/:id/status',
  requireRole(['teacher', 'admin']),
  validateExam.updateExamStatus,
  ExamController.updateExamStatus
);

// Delete exam (admin only)
router.delete(
  '/:id',
  requireRole(['admin']),
  validateExam.deleteExam,
  ExamController.deleteExam
);

export default router;
