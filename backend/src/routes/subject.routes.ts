import { Router } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { SubjectController } from '../controllers/subject.controller';

const router = Router();
const subjectController = new SubjectController();

// Apply authentication middleware
router.use(verifyToken);
router.use(requireRole(UserRole.ADMIN));

// Create a subject
router.post('/', subjectController.createSubject.bind(subjectController));

// Update a subject
router.put('/:id', subjectController.updateSubject.bind(subjectController));

// Delete a subject
router.delete('/:id', subjectController.deleteSubject.bind(subjectController));

// Get a specific subject
router.get('/:id', subjectController.getSubject.bind(subjectController));

// Get all subjects
router.get('/', subjectController.getAllSubjects.bind(subjectController));

// Search subjects
router.get('/search', subjectController.searchSubjects.bind(subjectController));

export default router;
