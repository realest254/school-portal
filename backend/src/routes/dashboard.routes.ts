import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// Stats endpoint - accessible by both admin and teachers
router.get(
  '/stats',
  verifyToken,
  requireRole(['admin', 'teacher']),
  DashboardController.getStats
);

export default router;
