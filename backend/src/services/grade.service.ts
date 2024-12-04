import { PoolClient } from 'pg';
import SQL from 'sql-template-strings';
import pool from '../db/index';
import { logError, logInfo } from '../utils/logger';
import { 
  ServiceError, 
  ServiceResult,
  PaginatedResult
} from '../types/common.types';
import { Grade, GradeQuery } from '../validators/grade.validator';

export class GradeNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`Grade not found: ${identifier}`, 'GRADE_NOT_FOUND', 404);
  }
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

  async getGrades(query: GradeQuery): Promise<PaginatedResult<Grade[]>> {
    try {
      const baseQuery = SQL`
        SELECT g.*, 
          s.name as student_name, 
          s.admission_number,
          c.name as class_name,
          sub.name as subject_name
        FROM grades g
        JOIN students s ON g.student_id = s.id
        JOIN classes c ON g.class_id = c.id
        JOIN subjects sub ON g.subject_id = sub.id
        WHERE 1=1
      `;

      if (query.class_id) {
        baseQuery.append(SQL` AND g.class_id = ${query.class_id}`);
      }
      if (query.student_id) {
        baseQuery.append(SQL` AND g.student_id = ${query.student_id}`);
      }
      if (query.subject_id) {
        baseQuery.append(SQL` AND g.subject_id = ${query.subject_id}`);
      }
      if (query.term) {
        baseQuery.append(SQL` AND g.term = ${query.term}`);
      }
      if (query.year) {
        baseQuery.append(SQL` AND g.year = ${query.year}`);
      }
      if (query.exam_name) {
        baseQuery.append(SQL` AND g.exam_name = ${query.exam_name}`);
      }

      const { rows } = await pool.query(baseQuery);
      
      return {
        data: rows,
        total: rows.length,
        page: 1,
        limit: rows.length
      };
    } catch (error) {
      logError('Error fetching grades:', error);
      throw error;
    }
  }

  async submitGrades(grades: Grade[]): Promise<ServiceResult<Grade[]>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedGrades = [];
      for (const grade of grades) {
        const { rows } = await client.query(SQL`
          INSERT INTO grades (
            student_id, class_id, subject_id,
            score, term, year, exam_name
          ) VALUES (
            ${grade.student_id}, ${grade.class_id}, ${grade.subject_id},
            ${grade.score}, ${grade.term}, ${grade.year}, ${grade.exam_name}
          ) RETURNING *
        `);
        insertedGrades.push(rows[0]);
      }

      await client.query('COMMIT');
      return { data: insertedGrades };
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error submitting grades:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateGrade(gradeId: string, grade: Partial<Grade>): Promise<ServiceResult<Grade>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updateFields = [];
      const values = [];
      let valueIndex = 1;

      if (grade.score !== undefined) {
        updateFields.push(`score = $${valueIndex}`);
        values.push(grade.score);
        valueIndex++;
      }
      if (grade.term !== undefined) {
        updateFields.push(`term = $${valueIndex}`);
        values.push(grade.term);
        valueIndex++;
      }
      if (grade.year !== undefined) {
        updateFields.push(`year = $${valueIndex}`);
        values.push(grade.year);
        valueIndex++;
      }
      if (grade.exam_name !== undefined) {
        updateFields.push(`exam_name = $${valueIndex}`);
        values.push(grade.exam_name);
        valueIndex++;
      }

      if (updateFields.length === 0) {
        throw new ServiceError('No fields to update', 'INVALID_UPDATE', 400);
      }

      const query = `
        UPDATE grades 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;
      values.push(gradeId);

      const { rows } = await client.query(query, values);
      if (rows.length === 0) {
        throw new GradeNotFoundError(gradeId);
      }

      await client.query('COMMIT');
      return { data: rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error updating grade:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteGrade(gradeId: string): Promise<ServiceResult<null>> {
    try {
      const { rowCount } = await pool.query(SQL`
        DELETE FROM grades WHERE id = ${gradeId}
      `);

      if (rowCount === 0) {
        throw new GradeNotFoundError(gradeId);
      }

      return { data: null };
    } catch (error) {
      logError('Error deleting grade:', error);
      throw error;
    }
  }

  async getStudentGrades(studentId: string): Promise<ServiceResult<Grade[]>> {
    try {
      const { rows } = await pool.query(SQL`
        SELECT g.*, 
          s.name as student_name,
          c.name as class_name,
          sub.name as subject_name
        FROM grades g
        JOIN students s ON g.student_id = s.id
        JOIN classes c ON g.class_id = c.id
        JOIN subjects sub ON g.subject_id = sub.id
        WHERE g.student_id = ${studentId}
        ORDER BY g.year DESC, g.term DESC, sub.name
      `);

      return { data: rows };
    } catch (error) {
      logError('Error fetching student grades:', error);
      throw error;
    }
  }

  async getClassGrades(classId: string, term?: number, year?: number): Promise<ServiceResult<Grade[]>> {
    try {
      const query = SQL`
        SELECT g.*, 
          s.name as student_name,
          s.admission_number,
          sub.name as subject_name
        FROM grades g
        JOIN students s ON g.student_id = s.id
        JOIN subjects sub ON g.subject_id = sub.id
        WHERE g.class_id = ${classId}
      `;

      if (term) query.append(SQL` AND g.term = ${term}`);
      if (year) query.append(SQL` AND g.year = ${year}`);

      query.append(SQL` ORDER BY s.name, sub.name`);

      const { rows } = await pool.query(query);
      return { data: rows };
    } catch (error) {
      logError('Error fetching class grades:', error);
      throw error;
    }
  }

  // New interface for grade statistics
  export interface GradeStatistics {
    classAverage: number;
    highestScore: number;
    lowestScore: number;
    studentRankings: {
      student_id: string;
      student_name: string;
      admission_number: string;
      total_score: number;
      average_score: number;
      rank: number;
      subject_scores: {
        [key: string]: number;
      };
    }[];
    subjectStatistics: {
      subject_id: string;
      subject_name: string;
      average: number;
      highest: number;
      lowest: number;
      passes: number;
      fails: number;
    }[];
  }

  async getGradeStatistics(
    classId: string,
    term: number,
    year: number,
    examName: string
  ): Promise<ServiceResult<GradeStatistics>> {
    const client = await pool.connect();
    try {
      // Get all grades for the exam
      const { rows: grades } = await client.query(SQL`
        SELECT 
          g.*,
          s.name as student_name,
          s.admission_number,
          sub.name as subject_name
        FROM grades g
        JOIN students s ON g.student_id = s.id
        JOIN subjects sub ON g.subject_id = sub.id
        WHERE g.class_id = ${classId}
          AND g.term = ${term}
          AND g.year = ${year}
          AND g.exam_name = ${examName}
      `);

      if (grades.length === 0) {
        return {
          data: {
            classAverage: 0,
            highestScore: 0,
            lowestScore: 0,
            studentRankings: [],
            subjectStatistics: []
          }
        };
      }

      // Calculate student totals and rankings
      const studentScores = new Map();
      const subjectStats = new Map();

      // Initialize subject statistics
      grades.forEach(grade => {
        if (!subjectStats.has(grade.subject_id)) {
          subjectStats.set(grade.subject_id, {
            subject_id: grade.subject_id,
            subject_name: grade.subject_name,
            scores: [],
            passes: 0,
            fails: 0
          });
        }
      });

      // Process grades
      grades.forEach(grade => {
        // Update student scores
        if (!studentScores.has(grade.student_id)) {
          studentScores.set(grade.student_id, {
            student_id: grade.student_id,
            student_name: grade.student_name,
            admission_number: grade.admission_number,
            total_score: 0,
            subject_count: 0,
            subject_scores: {}
          });
        }
        const student = studentScores.get(grade.student_id);
        student.total_score += grade.score;
        student.subject_count += 1;
        student.subject_scores[grade.subject_id] = grade.score;

        // Update subject statistics
        const subject = subjectStats.get(grade.subject_id);
        subject.scores.push(grade.score);
        if (grade.score >= 50) {
          subject.passes += 1;
        } else {
          subject.fails += 1;
        }
      });

      // Calculate rankings
      const rankings = Array.from(studentScores.values())
        .map(student => ({
          ...student,
          average_score: student.total_score / student.subject_count
        }))
        .sort((a, b) => b.average_score - a.average_score)
        .map((student, index) => ({
          ...student,
          rank: index + 1
        }));

      // Calculate subject statistics
      const subjectStatistics = Array.from(subjectStats.values()).map(subject => ({
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        average: subject.scores.reduce((a, b) => a + b, 0) / subject.scores.length,
        highest: Math.max(...subject.scores),
        lowest: Math.min(...subject.scores),
        passes: subject.passes,
        fails: subject.fails
      }));

      // Calculate overall statistics
      const allScores = grades.map(g => g.score);
      const classAverage = allScores.reduce((a, b) => a + b, 0) / allScores.length;

      return {
        data: {
          classAverage,
          highestScore: Math.max(...allScores),
          lowestScore: Math.min(...allScores),
          studentRankings: rankings,
          subjectStatistics
        }
      };
    } catch (error) {
      logError('Error calculating grade statistics:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const gradeService = GradeService.getInstance();
