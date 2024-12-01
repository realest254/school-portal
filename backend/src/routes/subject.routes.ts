import { Router, RequestHandler } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { SubjectController } from '../controllers/subject.controller';
import { subjectValidation } from '../validators/admin.validator';

const router = Router();

// Apply authentication middleware
router.use(verifyToken);

// Create a subject (admin only)
router.post(
  '/', 
  requireRole(UserRole.ADMIN),
  subjectValidation.create,
  SubjectController.createSubject as RequestHandler
);

// Update a subject (admin only)
router.put(
  '/:id', 
  requireRole(UserRole.ADMIN),
  subjectValidation.update,
  SubjectController.updateSubject as RequestHandler
);

// Delete a subject (admin only)
router.delete(
  '/:id', 
  requireRole(UserRole.ADMIN),
  SubjectController.deleteSubject as RequestHandler
);

// Get a specific subject
router.get(
  '/:id',
  SubjectController.getSubjectById as RequestHandler
);

// Get all subjects
router.get(
  '/',
  SubjectController.getAllSubjects as RequestHandler
);

// Search subjects
router.get(
  '/search',
  SubjectController.searchSubjects as RequestHandler
);

export default router;
