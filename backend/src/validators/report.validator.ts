import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Report schemas
const termReportSchema = z.object({
    term: z.number().int().min(1).max(3),
    year: z.number().int().min(2000),
    classId: z.string().optional()
});

const yearReportSchema = z.object({
    year: z.number().int().min(2000),
    classId: z.string().optional()
});

const studentReportQuerySchema = z.object({
    term: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(3)).optional(),
    year: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(2000)),
});

const classReportQuerySchema = z.object({
    term: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(3)).optional(),
    year: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(2000)),
    classId: z.string()
});

export const reportValidation = {
    validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                ...req.body,
                ...req.query,
                ...req.params
            });
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    },

    // Student report validations
    getStudentTermReport: (req: Request, res: Response, next: NextFunction) => {
        reportValidation.validate(studentReportQuerySchema)(req, res, next);
    },

    getStudentYearReport: (req: Request, res: Response, next: NextFunction) => {
        reportValidation.validate(yearReportSchema)(req, res, next);
    },

    // Class report validations
    getClassTermReport: (req: Request, res: Response, next: NextFunction) => {
        reportValidation.validate(classReportQuerySchema)(req, res, next);
    },

    getClassYearReport: (req: Request, res: Response, next: NextFunction) => {
        reportValidation.validate(yearReportSchema)(req, res, next);
    },

    // Report generation validations
    generateTermReport: (req: Request, res: Response, next: NextFunction) => {
        reportValidation.validate(termReportSchema)(req, res, next);
    },

    generateYearReport: (req: Request, res: Response, next: NextFunction) => {
        reportValidation.validate(yearReportSchema)(req, res, next);
    }
};
