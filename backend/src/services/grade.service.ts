import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { 
  ServiceError, 
  ServiceResult,
  createUUID
} from '../types/common.types';
import {
  Grade,
  GradeWithDetails,
  CreateGradeData,
  GradeNotFoundError,
  DuplicateGradeError,
  GradeSchema,
  SubjectScoresSchema,
  BulkGradeInput,
  GradeStatistics,
  GradesWithStats
} from '../types/grade.types';

// Custom filters interface for getStudentGradesByFilter
interface StudentGradeFilters {
  admissionNumber?: string;
  studentName?: string;
  classId?: string;
  examId?: string;
}

export class GradeService {
  private static instance: GradeService;
  private constructor() {}

  static getInstance(): GradeService {
    if (!GradeService.instance) {
      GradeService.instance = new GradeService();
    }
    return GradeService.instance;
  }

  private static validateFilters(filters: StudentGradeFilters): void {
    if (filters.admissionNumber) {
      z.string().min(1).max(50).parse(filters.admissionNumber);
    }
    if (filters.studentName) {
      z.string().min(1).max(100).parse(filters.studentName);
    }
    if (filters.classId) {
      z.string().uuid().parse(filters.classId);
    }
    if (filters.examId) {
      z.string().uuid().parse(filters.examId);
    }
  }

  async createBulkGrades(data: BulkGradeInput): Promise<ServiceResult<{ gradesSubmitted: number }>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate exam exists and get year
      const { rows: [exam] } = await client.query(SQL`
        SELECT year FROM exams WHERE id = ${data.examId}
      `);

      if (!exam) {
        throw new ServiceError('Exam not found', 'EXAM_NOT_FOUND', 404);
      }

      // Validate all students exist
      const studentIds = data.grades.map(g => g.studentId);
      const { rows: students } = await client.query(SQL`
        SELECT id FROM students WHERE id = ANY(${studentIds})
      `);

      if (students.length !== studentIds.length) {
        throw new ServiceError('One or more invalid student IDs', 'INVALID_STUDENT');
      }

      // Insert all grades
      const values = data.grades.map(grade => ({
        id: createUUID(uuidv4()),
        examId: data.examId,
        studentId: grade.studentId,
        subjectScores: grade.subjectScores,
        academicYear: exam.year
      }));

      const result = await client.query(SQL`
        INSERT INTO grades_optimized (
          id, exam_id, student_id, subject_scores, academic_year
        )
        SELECT 
          v.id, v.exam_id, v.student_id, v.subject_scores::jsonb, v.academic_year
        FROM jsonb_to_recordset(${JSON.stringify(values)}) AS v(
          id uuid, exam_id uuid, student_id uuid, 
          subject_scores jsonb, academic_year integer
        )
        ON CONFLICT (exam_id, student_id) DO NOTHING
      `);

      await client.query('COMMIT');
      return { 
        success: true,
        data: { gradesSubmitted: result.rowCount ?? 0 }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to create bulk grades', 'BULK_CREATE_ERROR');
    } finally {
      client.release();
    }
  }

  async getStudentGradesByFilter(filters: StudentGradeFilters): Promise<ServiceResult<GradesWithStats>> {
    try {
      GradeService.validateFilters(filters);

      // Get grades with details
      const baseQuery = SQL`
        SELECT DISTINCT 
          s.name as student_name,
          s.admission_number,
          c.name as class_name,
          e.name as exam_name,
          e.term,
          e.year,
          g.subject_scores,
          r.total_marks,
          r.average_score,
          r.rank,
          r.total_students,
          jsonb_object_agg(
            sub.id, 
            jsonb_build_object(
              'name', sub.name,
              'score', g.subject_scores->>sub.id
            )
          ) as subject_details
        FROM grades_optimized g
        JOIN students s ON g.student_id = s.id
        JOIN classes c ON s.id = ANY(
          SELECT student_id FROM class_students WHERE class_id = c.id
        )
        JOIN exams e ON g.exam_id = e.id
        LEFT JOIN exam_reports_mv r ON r.student_id = s.id 
          AND r.exam_id = g.exam_id
        JOIN subjects sub ON sub.id = ANY(array(SELECT jsonb_object_keys(g.subject_scores)))
        WHERE 1=1
      `;

      if (filters.admissionNumber) {
        baseQuery.append(SQL` AND s.admission_number = ${filters.admissionNumber}`);
      }
      if (filters.studentName) {
        baseQuery.append(SQL` AND s.name ILIKE ${`%${filters.studentName}%`}`);
      }
      if (filters.classId) {
        baseQuery.append(SQL` AND c.id = ${filters.classId}`);
      }
      if (filters.examId) {
        baseQuery.append(SQL` AND e.id = ${filters.examId}`);
      }

      baseQuery.append(SQL` 
        GROUP BY s.name, s.admission_number, c.name, e.name, e.term, e.year,
                 g.subject_scores, r.total_marks, r.average_score, r.rank, r.total_students
        ORDER BY e.year DESC, e.term DESC, student_name
      `);

      const { rows: gradeRows } = await pool.query(baseQuery);

      // Get statistics if examId is provided
      let statistics: GradeStatistics | null = null;
      if (filters.examId) {
        const statsQuery = SQL`
          WITH exam_stats AS (
            SELECT 
              ROUND(AVG(r.average_score), 2) as class_average,
              jsonb_object_agg(
                s.name,
                ROUND(AVG((g.subject_scores->>s.id)::numeric), 2)
              ) as subject_averages,
              MAX(r.total_marks) as highest_score,
              MIN(r.total_marks) as lowest_score,
              COUNT(*) FILTER (WHERE r.average_score >= 80) as grade_a,
              COUNT(*) FILTER (WHERE r.average_score >= 70 AND r.average_score < 80) as grade_b,
              COUNT(*) FILTER (WHERE r.average_score >= 60 AND r.average_score < 70) as grade_c,
              COUNT(*) FILTER (WHERE r.average_score >= 50 AND r.average_score < 60) as grade_d,
              COUNT(*) FILTER (WHERE r.average_score >= 40 AND r.average_score < 50) as grade_e,
              COUNT(*) FILTER (WHERE r.average_score < 40) as grade_f
            FROM exam_reports_mv r
            JOIN grades_optimized g ON g.exam_id = r.exam_id
            JOIN subjects s ON s.id = ANY(array(SELECT jsonb_object_keys(g.subject_scores)))
            WHERE r.exam_id = ${filters.examId}
          )
          SELECT * FROM exam_stats
        `;

        const { rows: [stats] } = await pool.query(statsQuery);
        if (stats) {
          statistics = {
            classAverage: stats.class_average,
            subjectAverages: stats.subject_averages,
            highestScore: stats.highest_score,
            lowestScore: stats.lowest_score,
            gradeDistribution: {
              A: stats.grade_a,
              B: stats.grade_b,
              C: stats.grade_c,
              D: stats.grade_d,
              E: stats.grade_e,
              F: stats.grade_f
            }
          };
        }
      }

      // Transform the rows
      const transformedRows = gradeRows.map(row => ({
        id: row.id,
        examId: row.exam_id,
        studentId: row.student_id,
        academicYear: row.academic_year,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        studentName: row.student_name,
        studentAdmissionNumber: row.admission_number,
        className: row.class_name,
        examName: row.exam_name,
        term: row.term,
        year: row.year,
        subjectScores: Object.entries(row.subject_details).map(([subjectId, details]: [string, any]) => ({
          subjectId,
          subjectName: details.name,
          score: parseInt(details.score)
        })),
        totalMarks: row.total_marks,
        averageScore: parseFloat(row.average_score),
        rank: row.rank,
        totalStudents: row.total_students
      }));

      return { 
        success: true,
        data: {
          grades: transformedRows,
          statistics: statistics || {
            classAverage: 0,
            subjectAverages: {},
            highestScore: 0,
            lowestScore: 0,
            gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
          }
        }
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching student grades:', errorMessage);
      throw new ServiceError('Failed to fetch student grades', 'FETCH_ERROR');
    }
  }

  private calculateGrade(score: number): string {
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    if (score >= 30) return 'D-';
    return 'E';
  }
}

export const gradeService = GradeService.getInstance();
