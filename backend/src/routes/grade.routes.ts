import { Router, RequestHandler } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { GradeController } from '../controllers/grade.controller';
import { gradeValidation } from '../validators/grade.validator';

const router = Router();

// Apply authentication middleware
router.use(verifyToken);

// Create bulk grades (teachers only)
router.post(
  '/bulk', 
  requireRole(UserRole.TEACHER),
  GradeController.createGrades as RequestHandler
);

// Get student grades by filter (teachers and students)
router.get(
  '/search',
  requireRole(UserRole.TEACHER),  // Teachers can search all grades
  GradeController.getStudentGradesByFilter as RequestHandler
);

// Get student grades by filter (student view - will only see their own grades)
router.get(
  '/student/grades',
  requireRole(UserRole.STUDENT),  // Students can only see their own grades
  GradeController.getStudentGradesByFilter as RequestHandler
);

export default router;
