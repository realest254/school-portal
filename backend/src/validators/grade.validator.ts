import { z } from 'zod';
import { UUID } from '../types/common.types';
import { body } from 'express-validator';

// Schema for individual subject scores in JSONB
const SubjectScoresSchema = z.record(z.string(), z.number().min(0).max(100));

export const GradeSchema = z.object({
  student_id: z.string().uuid(),
  subject_scores: SubjectScoresSchema
});

export const BulkGradesSubmissionSchema = z.object({
  examId: z.string().uuid(),
  grades: z.array(GradeSchema)
    .min(1)
    .max(100) // Limit batch size
});

// For querying grades
export const GradeQuerySchema = z.object({
  exam_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),
  term: z.number().min(1).max(3).optional(),
  year: z.number().min(2000).max(2100).optional()
});

// Express validator middleware
export const gradeValidation = {
  create: [
    body('examId').isUUID().withMessage('Valid exam ID is required'),
    body('studentId').isUUID().withMessage('Valid student ID is required'),
    body('subjectScores').isObject().withMessage('Subject scores must be an object'),
    body('academicYear').isInt({ min: 2000, max: 2100 }).withMessage('Valid academic year is required')
  ]
};

export type Grade = z.infer<typeof GradeSchema>;
export type BulkGradesSubmission = z.infer<typeof BulkGradesSubmissionSchema>;
export type GradeQuery = z.infer<typeof GradeQuerySchema>;
