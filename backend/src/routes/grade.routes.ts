import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getGrades,
  submitGrades,
  updateGrade,
  deleteGrade,
  getStudentGrades,
  getClassGrades,
  getGradeStatistics
} from '../controllers/grade.controller';

const router = express.Router();

// Apply auth middleware to all grade routes
router.use(authMiddleware);

// Grade management routes
router.get('/', getGrades);
router.post('/', submitGrades);
router.put('/:id', updateGrade);
router.delete('/:id', deleteGrade);

// Special routes for getting grades by student or class
router.get('/student/:studentId', getStudentGrades);
router.get('/class/:classId', getClassGrades);

// Get grade statistics
router.get('/statistics', getGradeStatistics);

export default router;
