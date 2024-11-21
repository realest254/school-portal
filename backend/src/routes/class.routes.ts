import { Router } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { ClassController } from '../controllers/class.controller';
import { classValidation } from '../validators/admin.validator';

const router = Router();

// Apply authentication middleware
router.use(verifyToken);
router.use(requireRole(UserRole.ADMIN));

// Create a class
router.post(
  '/',
  classValidation.validateCreate,
  ClassController.createClass
);

// Get all classes
router.get(
  '/',
  ClassController.getClasses
);

// Delete a class
router.delete(
  '/:name',
  ClassController.deleteClass
);

export default router;
