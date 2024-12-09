import { z } from 'zod';
import { UUID, ServiceError, ServiceResult, PaginationParams, PaginatedResult } from './common.types';

// Grade-specific error types
export class GradeNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`Grade not found: ${identifier}`, 'GRADE_NOT_FOUND', 404);
  }
}

export class DuplicateGradeError extends ServiceError {
  constructor(examId: string, studentId: string) {
    super(`Grade already exists for exam ${examId} and student ${studentId}`, 'DUPLICATE_GRADE', 409);
  }
}

// Validation schemas
export const SubjectScoresSchema = z.record(z.string().uuid(), z.number().min(0).max(100));

export const BulkGradeSchema = z.object({
  examId: z.string().uuid(),
  grades: z.array(z.object({
    studentId: z.string().uuid(),
    subjectScores: SubjectScoresSchema
  }))
});

export const GradeSchema = z.object({
  id: z.string().uuid(),
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  subjectScores: SubjectScoresSchema,
  academicYear: z.number().int().min(2000).max(2100),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Grade = z.infer<typeof GradeSchema>;
export type BulkGradeInput = z.infer<typeof BulkGradeSchema>;

export interface GradeFilters extends PaginationParams {
  examId?: string;
  studentId?: string;
  subjectId?: string;
  academicYear?: number;
}

export interface CreateGradeData {
  examId: string;
  studentId: string;
  subjectScores: Record<string, number>; // subject_id: score mapping
  academicYear: number;
}

export interface UpdateGradeData {
  subjectScores?: Record<string, number>;
}

export interface GradeStatistics {
  classAverage: number;
  subjectAverages: Record<string, number>;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    F: number;
  };
}

export interface GradeWithDetails extends Omit<Grade, 'subjectScores'> {
  studentName: string;
  studentAdmissionNumber: string;
  className: string;
  examName: string;
  term: number;
  year: number;
  subjectScores: Array<{
    subjectId: string;
    subjectName: string;
    score: number;
  }>;
  totalMarks?: number;
  averageScore?: number;
  rank?: number;
  totalStudents?: number;
}

export interface GradesWithStats {
  grades: GradeWithDetails[];
  statistics: GradeStatistics;
}
