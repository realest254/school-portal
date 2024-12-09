import { Router, RequestHandler } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { reportController } from '../controllers/report.controller';
import { reportValidation } from '../validators/report.validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Student Reports
// Get student's term report
router.get(
    '/student/:studentId/term',
    reportValidation.getStudentTermReport,
    reportController.getStudentTermReport as RequestHandler
);

// Get student's year report
router.get(
    '/student/:studentId/year',
    reportValidation.getStudentYearReport,
    reportController.getStudentYearReport as RequestHandler
);

// Class Reports
// Get class term report (teachers and admins only)
router.get(
    '/class/:classId/term',
    requireRole([UserRole.TEACHER, UserRole.ADMIN] as UserRole[]),
    reportValidation.getClassTermReport,
    reportController.getClassTermReport as RequestHandler
);

// Get class year report (teachers and admins only)
router.get(
    '/class/:classId/year',
    requireRole([UserRole.TEACHER, UserRole.ADMIN] as UserRole[]),
    reportValidation.getClassYearReport,
    reportController.getClassYearReport as RequestHandler
);

// Report Generation
// Generate term report (admin only)
router.post(
    '/generate/term',
    requireRole([UserRole.ADMIN] as UserRole[]),
    reportValidation.generateTermReport,
    reportController.generateTermReport as RequestHandler
);

// Generate year report (admin only)
router.post(
    '/generate/year',
    requireRole([UserRole.ADMIN] as UserRole[]),
    reportValidation.generateYearReport,
    reportController.generateYearReport as RequestHandler
);

export default router;
