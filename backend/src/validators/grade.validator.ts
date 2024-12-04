import { z } from 'zod';
import { UUID } from '../types/common.types';

export const GradeSchema = z.object({
  student_id: UUID,
  class_id: UUID,
  subject_id: UUID,
  score: z.number().min(0).max(100),
  term: z.number().min(1).max(3),
  year: z.number().min(2000).max(2100),
  exam_name: z.string().min(1).max(100)
});

export const BulkGradesSchema = z.object({
  grades: z.array(GradeSchema)
    .min(1)
    .max(100) // Limit batch size
});

export const GradeQuerySchema = z.object({
  class_id: UUID.optional(),
  student_id: UUID.optional(),
  subject_id: UUID.optional(),
  term: z.number().min(1).max(3).optional(),
  year: z.number().min(2000).max(2100).optional(),
  exam_name: z.string().optional()
});

export type Grade = z.infer<typeof GradeSchema>;
export type BulkGrades = z.infer<typeof BulkGradesSchema>;
export type GradeQuery = z.infer<typeof GradeQuerySchema>;
