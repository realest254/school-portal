import { Router, RequestHandler } from 'express';
import { ClassController } from '../controllers/class.controller';
import { classValidation } from '../validators/admin.validator';

const router = Router();

// Create a class
router.post(
  '/',
  classValidation.validateCreate,
  ClassController.createClass as RequestHandler
);

// Get all classes
router.get(
  '/',
  ClassController.getAllClasses as RequestHandler
);

// Get class by name
router.get(
  '/:name',
  ClassController.getClass as RequestHandler
);

// Update class
router.put(
  '/:id',
  ClassController.updateClass as RequestHandler
);

// Delete class
router.delete(
  '/:id',
  ClassController.deleteClass as RequestHandler
);

export default router;
