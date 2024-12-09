import { pool } from '../db';
import { ServiceError } from '../types/common.types';
import { 
  Exam, 
  ExamQuery, 
  ExamStats, 
  SubjectStats, 
  CreateExamDTO, 
  UpdateExamDTO 
} from '../types/exam.types';

class ExamService {
  async createExam(data: CreateExamDTO): Promise<Exam> {
    const { name, term, year, classId } = data;
    
    try {
      const result = await pool.query(
        `INSERT INTO exams (name, term, year, class_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, term, year, class_id as "classId", status, 
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [name, term, year, classId]
      );
      return result.rows[0];
    } catch (error) {
      throw new ServiceError('Failed to create exam', 'DATABASE_ERROR');
    }
  }

  async getExamById(id: string): Promise<Exam | null> {
    try {
      const result = await pool.query(
        `SELECT e.id, e.name, e.term, e.year, 
                e.class_id as "classId", c.name as "className",
                e.status, e.created_at as "createdAt", e.updated_at as "updatedAt"
         FROM exams e
         LEFT JOIN classes c ON e.class_id = c.id
         WHERE e.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw new ServiceError('Failed to fetch exam', 'DATABASE_ERROR');
    }
  }

  async getExams(query: ExamQuery): Promise<Exam[]> {
    try {
      let sqlQuery = `
        SELECT e.id, e.name, e.term, e.year, 
               e.class_id as "classId", c.name as "className",
               e.status, e.created_at as "createdAt", e.updated_at as "updatedAt"
        FROM exams e
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramCount = 1;

      if (query.term) {
        sqlQuery += ` AND e.term = $${paramCount++}`;
        values.push(query.term);
      }
      if (query.year) {
        sqlQuery += ` AND e.year = $${paramCount++}`;
        values.push(query.year);
      }
      if (query.status) {
        sqlQuery += ` AND e.status = $${paramCount++}`;
        values.push(query.status);
      }
      if (query.classId) {
        sqlQuery += ` AND e.class_id = $${paramCount++}`;
        values.push(query.classId);
      }

      sqlQuery += ' ORDER BY e.year DESC, e.term DESC, e.created_at DESC';

      const result = await pool.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      throw new ServiceError('Failed to fetch exams', 'DATABASE_ERROR');
    }
  }

  async updateExamStatus(id: string, data: UpdateExamDTO): Promise<Exam> {
    try {
      const result = await pool.query(
        `UPDATE exams
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, name, term, year, class_id as "classId", 
                   status, created_at as "createdAt", updated_at as "updatedAt"`,
        [data.status, id]
      );

      if (!result.rows[0]) {
        throw new ServiceError('Exam not found', 'NOT_FOUND');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to update exam status', 'DATABASE_ERROR');
    }
  }

  async deleteExam(id: string): Promise<void> {
    try {
      const result = await pool.query(
        'DELETE FROM exams WHERE id = $1 RETURNING id',
        [id]
      );

      if (!result.rows[0]) {
        throw new ServiceError('Exam not found', 'NOT_FOUND');
      }
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to delete exam', 'DATABASE_ERROR');
    }
  }

  async getExamStatistics(id: string): Promise<SubjectStats[]> {
    try {
      const result = await pool.query(
        `WITH stats AS (
          SELECT 
            s.id as "subjectId",
            s.name as "subjectName",
            COUNT(g.id) as "totalGrades",
            ROUND(AVG(g.score)::numeric, 2) as "averageScore",
            MIN(g.score) as "minScore",
            MAX(g.score) as "maxScore",
            COUNT(CASE WHEN g.score >= 50 THEN 1 END) as "passingCount"
          FROM subjects s
          LEFT JOIN grades g ON s.id = g.subject_id AND g.exam_id = $1
          GROUP BY s.id, s.name
        )
        SELECT 
          stats.*,
          ROUND((stats."passingCount"::float / NULLIF(stats."totalGrades", 0) * 100)::numeric, 2) as "passRate"
        FROM stats
        ORDER BY stats."subjectName"`,
        [id]
      );
      return result.rows;
    } catch (error) {
      throw new ServiceError('Failed to fetch exam statistics', 'DATABASE_ERROR');
    }
  }
}

export const examService = new ExamService();
