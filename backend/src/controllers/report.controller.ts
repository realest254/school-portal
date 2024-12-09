import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { reportService } from '../services/report.service';
import { logError } from '../utils/logger';
import { ServiceError } from '../types/common.types';
import { 
    AuthenticatedRequest, 
    checkIsAdminOrError,
    checkIsSameUserOrAdmin,
    handleAuthError,
    AuthorizationError 
} from '../types/auth.types';
import { UserRole } from '../middlewares/auth.middleware';

export class ReportController {
    // Get student's term report
    // Access rules:
    // - Students can only view their own reports
    // - Teachers can view reports for students in their classes
    // - Admins can view any student's reports
    async getStudentTermReport(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const studentId = req.params.studentId;
            const { term, year } = req.query;

            // Check access permissions
            try {
                checkIsSameUserOrAdmin(req.user, studentId);
            } catch (error) {
                const authError = handleAuthError(error);
                if (authError) {
                    return res.status(authError.status).json(authError);
                }
                throw error;
            }

            const result = await reportService.getStudentTermReport(
                studentId,
                {
                    term: Number(term),
                    year: Number(year)
                }
            );

            res.json(result);
        } catch (error) {
            logError(error, `Failed to get term report for student ${req.params.studentId}`);
            if (error instanceof ServiceError) {
                return res.status(error.status).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get student's year report
    async getStudentYearReport(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const studentId = req.params.studentId;
            const { year } = req.query;

            // Check access permissions
            try {
                checkIsSameUserOrAdmin(req.user, studentId);
            } catch (error) {
                const authError = handleAuthError(error);
                if (authError) {
                    return res.status(authError.status).json(authError);
                }
                throw error;
            }

            const result = await reportService.getStudentYearReport(
                studentId,
                { year: Number(year) }
            );

            res.json(result);
        } catch (error) {
            logError(error, `Failed to get year report for student ${req.params.studentId}`);
            if (error instanceof ServiceError) {
                return res.status(error.status).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get class term report
    // Access rules:
    // - Only teachers assigned to the class and admins can view
    async getClassTermReport(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const classId = req.params.classId;
            const { term, year } = req.query;

            // Only teachers and admins can access class reports
            if (req.user.role === UserRole.STUDENT) {
                throw new AuthorizationError('Only teachers and admins can access class reports');
            }

            const result = await reportService.getClassTermReport({
                classId,
                term: Number(term),
                year: Number(year)
            });

            res.json(result);
        } catch (error) {
            logError(error, `Failed to get term report for class ${req.params.classId}`);
            if (error instanceof ServiceError || error instanceof AuthorizationError) {
                return res.status(error instanceof AuthorizationError ? 403 : error.status)
                    .json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get class year report
    async getClassYearReport(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const classId = req.params.classId;
            const { year } = req.query;

            // Only teachers and admins can access class reports
            if (req.user.role === UserRole.STUDENT) {
                throw new AuthorizationError('Only teachers and admins can access class reports');
            }

            const result = await reportService.getClassYearReport({
                classId,
                year: Number(year)
            });

            res.json(result);
        } catch (error) {
            logError(error, `Failed to get year report for class ${req.params.classId}`);
            if (error instanceof ServiceError || error instanceof AuthorizationError) {
                return res.status(error instanceof AuthorizationError ? 403 : error.status)
                    .json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Generate term report
    // Access rules:
    // - Only admins can generate reports
    async generateTermReport(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Check if user is admin
            try {
                checkIsAdminOrError(req.user);
            } catch (error) {
                const authError = handleAuthError(error);
                if (authError) {
                    return res.status(authError.status).json(authError);
                }
                throw error;
            }

            const { term, year, classId } = req.body;

            const result = await reportService.generateTermReport({
                term: Number(term),
                year: Number(year),
                classId
            });

            res.json(result);
        } catch (error) {
            logError(error, 'Failed to generate term report');
            if (error instanceof ServiceError) {
                return res.status(error.status).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Generate year report
    async generateYearReport(req: AuthenticatedRequest, res: Response) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Check if user is admin
            try {
                checkIsAdminOrError(req.user);
            } catch (error) {
                const authError = handleAuthError(error);
                if (authError) {
                    return res.status(authError.status).json(authError);
                }
                throw error;
            }

            const { year, classId } = req.body;

            const result = await reportService.generateYearReport({
                year: Number(year),
                classId
            });

            res.json(result);
        } catch (error) {
            logError(error, 'Failed to generate year report');
            if (error instanceof ServiceError) {
                return res.status(error.status).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export const reportController = new ReportController();
