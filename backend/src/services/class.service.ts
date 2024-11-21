import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const ClassSchema = z.object({
  name: z.string().min(1),
  grade: z.number().int().min(1).max(12),
  stream: z.string().optional(),
  classTeacherId: z.string().uuid().optional(),
  academicYear: z.number().int().min(2000).max(2100)
});

const ClassSubjectSchema = z.object({
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional()
});

export class ClassService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  async create(data: {
    name: string;
    grade: number;
    stream?: string;
    classTeacherId?: string;
    academicYear: number;
  }) {
    try {
      // Validate input
      ClassSchema.parse(data);

      const query = SQL`
        INSERT INTO classes (
          name, grade, stream, class_teacher_id, academic_year
        )
        VALUES (
          ${data.name},
          ${data.grade},
          ${data.stream},
          ${data.classTeacherId},
          ${data.academicYear}
        )
        RETURNING *
      `;

      const { rows: [newClass] } = await this.db.query(query);
      return newClass;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Class with name ${data.name} already exists for academic year ${data.academicYear}`);
      }
      const message = error instanceof Error ? error.message : 'Failed to create class';
      throw new Error(`Failed to create class: ${message}`);
    }
  }

  async update(id: string, data: {
    name?: string;
    grade?: number;
    stream?: string;
    classTeacherId?: string;
    academicYear?: number;
  }) {
    try {
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }

      const setClause = [];
      const values = [id];
      let paramCount = 2;

      if (data.name) {
        setClause.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.grade) {
        setClause.push(`grade = $${paramCount++}`);
        values.push(data.grade);
      }
      if (data.stream !== undefined) {
        setClause.push(`stream = $${paramCount++}`);
        values.push(data.stream);
      }
      if (data.classTeacherId !== undefined) {
        setClause.push(`class_teacher_id = $${paramCount++}`);
        values.push(data.classTeacherId);
      }
      if (data.academicYear) {
        setClause.push(`academic_year = $${paramCount++}`);
        values.push(data.academicYear);
      }

      const query = `
        UPDATE classes
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const { rows: [updatedClass] } = await this.db.query(query, values);
      
      if (!updatedClass) {
        throw new Error('Class not found');
      }

      return updatedClass;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Class with name ${data.name} already exists for this academic year`);
      }
      const message = error instanceof Error ? error.message : 'Failed to update class';
      throw new Error(`Failed to update class: ${message}`);
    }
  }

  async delete(id: string) {
    try {
      // Check if class has any students
      const checkQuery = SQL`
        SELECT EXISTS (
          SELECT 1 FROM students WHERE class_id = ${id}
        )
      `;
      
      const { rows: [{ exists }] } = await this.db.query(checkQuery);
      
      if (exists) {
        throw new Error('Cannot delete class that has students assigned to it');
      }

      const query = SQL`
        DELETE FROM classes
        WHERE id = ${id}
        RETURNING *
      `;

      const { rows: [deletedClass] } = await this.db.query(query);
      
      if (!deletedClass) {
        throw new Error('Class not found');
      }

      return deletedClass;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to delete class';
      throw new Error(`Failed to delete class: ${message}`);
    }
  }

  async getById(id: string) {
    try {
      const query = SQL`
        SELECT 
          c.*,
          json_agg(DISTINCT jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'teacherId', cs.teacher_id
          )) as subjects,
          json_build_object(
            'id', t.id,
            'name', t.name,
            'email', t.email
          ) as class_teacher
        FROM classes c
        LEFT JOIN class_subjects cs ON c.id = cs.class_id
        LEFT JOIN subjects s ON cs.subject_id = s.id
        LEFT JOIN teachers t ON c.class_teacher_id = t.id
        WHERE c.id = ${id}
        GROUP BY c.id, t.id
      `;

      const { rows: [class_] } = await this.db.query(query);
      return class_ || null;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get class';
      throw new Error(`Failed to get class: ${message}`);
    }
  }

  async getAll(filters?: {
    grade?: number;
    academicYear?: number;
  }) {
    try {
      let query = SQL`
        SELECT 
          c.*,
          json_agg(DISTINCT jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'teacherId', cs.teacher_id
          )) as subjects,
          json_build_object(
            'id', t.id,
            'name', t.name,
            'email', t.email
          ) as class_teacher
        FROM classes c
        LEFT JOIN class_subjects cs ON c.id = cs.class_id
        LEFT JOIN subjects s ON cs.subject_id = s.id
        LEFT JOIN teachers t ON c.class_teacher_id = t.id
        WHERE 1=1
      `;

      if (filters?.grade) {
        query.append(SQL` AND c.grade = ${filters.grade}`);
      }
      if (filters?.academicYear) {
        query.append(SQL` AND c.academic_year = ${filters.academicYear}`);
      }

      query.append(SQL` GROUP BY c.id, t.id ORDER BY c.grade ASC, c.name ASC`);

      const { rows } = await this.db.query(query);
      return rows;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get classes';
      throw new Error(`Failed to get classes: ${message}`);
    }
  }

  async addSubject(classId: string, data: { subjectId: string; teacherId?: string }) {
    try {
      ClassSubjectSchema.parse(data);

      const query = SQL`
        INSERT INTO class_subjects (class_id, subject_id, teacher_id)
        VALUES (${classId}, ${data.subjectId}, ${data.teacherId})
        RETURNING *
      `;

      const { rows: [classSubject] } = await this.db.query(query);
      return classSubject;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Subject is already assigned to this class');
      }
      const message = error instanceof Error ? error.message : 'Failed to add subject to class';
      throw new Error(`Failed to add subject to class: ${message}`);
    }
  }

  async removeSubject(classId: string, subjectId: string) {
    try {
      const query = SQL`
        DELETE FROM class_subjects
        WHERE class_id = ${classId} AND subject_id = ${subjectId}
        RETURNING *
      `;

      const { rows: [classSubject] } = await this.db.query(query);
      
      if (!classSubject) {
        throw new Error('Subject is not assigned to this class');
      }

      return classSubject;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to remove subject from class';
      throw new Error(`Failed to remove subject from class: ${message}`);
    }
  }

  async updateSubjectTeacher(classId: string, subjectId: string, teacherId: string) {
    try {
      const query = SQL`
        UPDATE class_subjects
        SET teacher_id = ${teacherId}, updated_at = CURRENT_TIMESTAMP
        WHERE class_id = ${classId} AND subject_id = ${subjectId}
        RETURNING *
      `;

      const { rows: [classSubject] } = await this.db.query(query);
      
      if (!classSubject) {
        throw new Error('Subject is not assigned to this class');
      }

      return classSubject;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to update subject teacher';
      throw new Error(`Failed to update subject teacher: ${message}`);
    }
  }
}
