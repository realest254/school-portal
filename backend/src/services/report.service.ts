import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import {
  ServiceError,
  ServiceResult,
  ExamReport,
  TermReport,
  YearReport,
  ClassTermReport,
  ClassYearReport,
  GenerateTermReportRequest,
  GenerateYearReportRequest
} from '../types/common.types';

// Report-specific error types
export class ReportNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`Report not found: ${identifier}`, 'REPORT_NOT_FOUND', 404);
  }
}

// Validation schemas
const TermReportSchema = z.object({
  term: z.number().min(1).max(3),
  year: z.number().min(2000).max(2100),
  classId: z.string().uuid().optional()
});

const YearReportSchema = z.object({
  year: z.number().min(2000).max(2100),
  classId: z.string().uuid().optional()
});

export class ReportService {
  private static instance: ReportService;

  private constructor() {}

  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  // Validation methods
  private validateTermFilters(filters: GenerateTermReportRequest): void {
    try {
      TermReportSchema.parse(filters);
    } catch (error) {
      throw new ServiceError('Invalid term report filters', 'INVALID_FILTERS', 400);
    }
  }

  private validateYearFilters(filters: GenerateYearReportRequest): void {
    try {
      YearReportSchema.parse(filters);
    } catch (error) {
      throw new ServiceError('Invalid year report filters', 'INVALID_FILTERS', 400);
    }
  }

  // Student Reports
  async getStudentTermReport(studentId: string, filters: GenerateTermReportRequest): Promise<ServiceResult<TermReport>> {
    try {
      this.validateTermFilters(filters);
      
      const query = SQL`
        SELECT 
          tr.*,
          s.name as student_name,
          s.admission_number,
          c.name as class_name,
          c.grade,
          json_agg(
            json_build_object(
              'exam_id', er.exam_id,
              'exam_name', e.name,
              'date', e.created_at,
              'total_marks', er.total_marks,
              'average_score', er.average_score,
              'rank', er.rank,
              'total_students', er.total_students,
              'subject_scores', g.subject_scores
            ) ORDER BY e.created_at
          ) as exams
        FROM term_reports tr
        JOIN students s ON s.id = tr.student_id
        JOIN classes c ON c.id = tr.class_id
        LEFT JOIN exam_reports_mv er ON er.student_id = tr.student_id
        LEFT JOIN exams e ON e.id = er.exam_id
        LEFT JOIN grades_optimized g ON g.exam_id = e.id AND g.student_id = tr.student_id
        WHERE tr.student_id = ${studentId}
        AND tr.term = ${filters.term}
        AND tr.year = ${filters.year}
        GROUP BY tr.student_id, tr.class_id, tr.term, tr.year, 
                tr.term_average, tr.avg_term_marks, tr.term_rank,
                s.name, s.admission_number, c.name, c.grade
      `;

      const result = await pool.query(query);
      
      if (!result.rows.length) {
        throw new ReportNotFoundError(`Term ${filters.term}, Year ${filters.year}`);
      }

      const report = this.mapToTermReport(result.rows[0]);
      
      logInfo(`Retrieved term report for student ${studentId}`, { studentId, ...filters });
      return { success: true, data: report };

    } catch (error) {
      logError(error, `Failed to get term report for student ${studentId}`);
      throw error;
    }
  }

  async getStudentYearReport(studentId: string, filters: GenerateYearReportRequest): Promise<ServiceResult<YearReport>> {
    try {
      this.validateYearFilters(filters);
      
      const termReports = await Promise.all(
        [1, 2, 3].map(term => 
          this.getStudentTermReport(studentId, { ...filters, term })
            .then(result => result.data!)
        )
      );

      const report: YearReport = {
        year: filters.year,
        terms: termReports,
        yearAverage: this.calculateAverage(termReports.map(t => t.termAverage)),
        yearRank: this.calculateAverage(termReports.map(t => t.termRank)),
        totalStudents: termReports[0]?.totalStudents || 0,
        classAverage: this.calculateAverage(termReports.map(t => t.classAverage))
      };

      logInfo(`Retrieved year report for student ${studentId}`, { studentId, ...filters });
      return { success: true, data: report };

    } catch (error) {
      logError(error, `Failed to get year report for student ${studentId}`);
      throw error;
    }
  }

  // Class Reports
  async getClassTermReport(filters: GenerateTermReportRequest): Promise<ServiceResult<ClassTermReport>> {
    try {
      this.validateTermFilters(filters);
      
      const query = SQL`
        WITH student_exams AS (
          SELECT 
            tr.student_id,
            json_agg(
              json_build_object(
                'exam_id', er.exam_id,
                'exam_name', e.name,
                'date', e.created_at,
                'total_marks', er.total_marks,
                'average_score', er.average_score,
                'rank', er.rank,
                'subject_scores', g.subject_scores
              ) ORDER BY e.created_at
            ) as exams
          FROM term_reports tr
          LEFT JOIN exam_reports_mv er ON er.student_id = tr.student_id
          LEFT JOIN exams e ON e.id = er.exam_id AND e.term = tr.term
          LEFT JOIN grades_optimized g ON g.exam_id = e.id AND g.student_id = tr.student_id
          WHERE tr.class_id = ${filters.classId}
          AND tr.term = ${filters.term}
          AND tr.year = ${filters.year}
          GROUP BY tr.student_id
        )
        SELECT 
          c.id as class_id,
          c.name as class_name,
          c.grade,
          ${filters.term} as term,
          ${filters.year} as year,
          ROUND(AVG(tr.term_average), 2) as class_average,
          COUNT(DISTINCT tr.student_id) as total_students,
          json_agg(
            json_build_object(
              'student_id', s.id,
              'student_name', s.name,
              'admission_number', s.admission_number,
              'term_average', tr.term_average,
              'term_rank', tr.term_rank,
              'exams', se.exams
            ) ORDER BY tr.term_rank
          ) as students
        FROM classes c
        JOIN term_reports tr ON tr.class_id = c.id
        JOIN students s ON s.id = tr.student_id
        LEFT JOIN student_exams se ON se.student_id = s.id
        WHERE c.id = ${filters.classId}
        AND tr.term = ${filters.term}
        AND tr.year = ${filters.year}
        GROUP BY c.id, c.name, c.grade
      `;

      const result = await pool.query(query);
      
      if (!result.rows.length) {
        throw new ReportNotFoundError(`Class ${filters.classId}, Term ${filters.term}, Year ${filters.year}`);
      }

      const report = this.mapToClassTermReport(result.rows[0]);

      logInfo(`Retrieved term report for class ${filters.classId}`, filters);
      return { success: true, data: report };

    } catch (error) {
      logError(error, `Failed to get term report for class ${filters.classId}`);
      throw error;
    }
  }

  async getClassYearReport(filters: GenerateYearReportRequest): Promise<ServiceResult<ClassYearReport>> {
    try {
      this.validateYearFilters(filters);
      
      const termReports = await Promise.all(
        [1, 2, 3].map(term => 
          this.getClassTermReport({ ...filters, term })
            .then(result => result.data!)
        )
      );

      const report: ClassYearReport = {
        year: filters.year,
        classId: filters.classId!,
        className: termReports[0].className,
        terms: termReports.map(tr => ({
          term: tr.term,
          classAverage: tr.classAverage,
          students: tr.students.map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            admissionNumber: s.admissionNumber,
            termAverage: s.termAverage,
            rank: s.rank
          }))
        })),
        yearAverage: this.calculateAverage(termReports.map(t => t.classAverage)),
        totalStudents: termReports[0].totalStudents
      };

      logInfo(`Retrieved year report for class ${filters.classId}`, filters);
      return { success: true, data: report };

    } catch (error) {
      logError(error, `Failed to get year report for class ${filters.classId}`);
      throw error;
    }
  }

  // Report Generation
  async generateTermReport(filters: GenerateTermReportRequest): Promise<ServiceResult<null>> {
    try {
      this.validateTermFilters(filters);
      
      // The materialized view will be refreshed automatically by the trigger
      // We just need to verify the exam exists
      const query = SQL`
        SELECT EXISTS (
          SELECT 1 FROM exams 
          WHERE year = ${filters.year} 
          AND term = ${filters.term}
      `;

      if (filters.classId) {
        query.append(SQL` AND class_id = ${filters.classId}`);
      }

      query.append(SQL`) as exists`);

      const result = await pool.query(query);
      
      if (!result.rows[0].exists) {
        throw new ReportNotFoundError(`Term ${filters.term}, Year ${filters.year}`);
      }

      logInfo(`Generated term report for ${filters.term}, ${filters.year}`, filters);
      return { success: true, data: null };

    } catch (error) {
      logError(error, `Failed to generate term report for term ${filters.term}, year ${filters.year}`);
      throw error;
    }
  }

  async generateYearReport(filters: GenerateYearReportRequest): Promise<ServiceResult<null>> {
    try {
      this.validateYearFilters(filters);
      
      // Generate reports for all terms
      await Promise.all([1, 2, 3].map(term => 
        this.generateTermReport({ ...filters, term })
      ));

      logInfo(`Generated year report for ${filters.year}`, filters);
      return { success: true, data: null };

    } catch (error) {
      logError(error, `Failed to generate year report for year ${filters.year}`);
      throw error;
    }
  }

  // Helper methods
  private calculateAverage(numbers: number[]): number {
    return numbers.length ? Math.round((numbers.reduce((a, b) => a + b) / numbers.length) * 100) / 100 : 0;
  }

  private mapToTermReport(row: any): TermReport {
    return {
      term: row.term,
      year: row.year,
      exams: row.exams.map((exam: any) => ({
        examId: exam.exam_id,
        examName: exam.exam_name,
        date: new Date(exam.date),
        scores: Object.entries(exam.subject_scores).map(([subjectId, score]) => ({
          subjectId,
          subjectName: '', // TODO: Join with subjects table to get name
          score: Number(score),
          grade: this.calculateGrade(Number(score))
        })),
        totalMarks: exam.total_marks,
        average: exam.average_score,
        rank: exam.rank,
        totalStudents: exam.total_students
      })),
      termAverage: row.term_average,
      termRank: row.term_rank,
      totalStudents: row.total_students,
      classAverage: row.class_average
    };
  }

  private mapToClassTermReport(row: any): ClassTermReport {
    return {
      term: row.term,
      year: row.year,
      classId: row.class_id,
      className: row.class_name,
      students: row.students.map((student: any) => ({
        studentId: student.student_id,
        studentName: student.student_name,
        admissionNumber: student.admission_number,
        termAverage: student.term_average,
        rank: student.term_rank,
        exams: student.exams.map((exam: any) => ({
          examId: exam.exam_id,
          examName: exam.exam_name,
          date: new Date(exam.date),
          scores: Object.entries(exam.subject_scores).map(([subjectId, score]) => ({
            subjectId,
            subjectName: '', // TODO: Join with subjects table to get name
            score: Number(score),
            grade: this.calculateGrade(Number(score))
          })),
          totalMarks: exam.total_marks,
          average: exam.average_score,
          rank: exam.rank,
          totalStudents: exam.total_students
        }))
      })),
      classAverage: row.class_average,
      totalStudents: row.total_students
    };
  }

  private calculateGrade(score: number): string {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 40) return 'D';
    return 'E';
  }
}

export const reportService = ReportService.getInstance();
