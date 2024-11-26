import { PoolClient } from 'pg';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import { 
  ServiceError, 
  PaginatedResult, 
  ServiceResult, 
  UUID, 
  Email, 
  PhoneNumber,
  createUUID,
  createEmail,
  createPhoneNumber,
  createTeacherName,
  createEmployeeId,
  createJoinDate
} from '../types/common.types';

// Teacher-specific error types
export class TeacherNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`Teacher not found: ${identifier}`, 'TEACHER_NOT_FOUND', 404);
  }
}

export class DuplicateTeacherError extends ServiceError {
  constructor(field: string) {
    super(`Teacher with this ${field} already exists`, 'DUPLICATE_TEACHER', 409);
  }
}

export class SubjectNotFoundError extends ServiceError {
  constructor(subjects: string) {
    super(subjects, 'SUBJECTS_NOT_FOUND', 400);
  }
}

// Validation schemas
const TeacherSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  employeeId: z.string().min(3).max(20),
  subjects: z.array(z.string()).optional(),
  class: z.string().optional(),
  joinDate: z.coerce.date()
});

type TeacherInput = z.infer<typeof TeacherSchema>;

interface TeacherFilters {
  status?: 'active' | 'inactive';
  search?: string;  // Will match against name, email, or employeeId
  class?: string;
  page?: number;
  limit?: number;
}

export interface CreateTeacherData {
  name: string;
  employeeId: string;
  email: string;
  subjects: string[];
  phone: string;
  joinDate: string;
  class?: string;
}

export interface UpdateTeacherData {
  name?: string;
  employeeId?: string;
  email?: string;
  subjects?: string[];
  phone?: string;
  joinDate?: string;
  status?: 'active' | 'inactive';
  class?: string;
}

interface GetTeacherIdentifier {
  id?: string;
  employeeId?: string;
  email?: string;
  name?: string;
}

export class TeacherService {
  private static instance: TeacherService;
  private constructor() {}

  static getInstance(): TeacherService {
    if (!TeacherService.instance) {
      TeacherService.instance = new TeacherService();
    }
    return TeacherService.instance;
  }

  private validateFilters(filters: TeacherFilters): void {
    if (filters.status) {
      z.enum(['active', 'inactive']).parse(filters.status);
    }
    if (filters.page) {
      z.number().positive().parse(filters.page);
    }
    if (filters.limit) {
      z.number().positive().max(100).parse(filters.limit);
    }
  }

  private async getSubjectIdsByNames(
    client: PoolClient,
    subjectNames: string[]
  ): Promise<number[]> {
    if (!subjectNames || subjectNames.length === 0) {
      return [];
    }

    const result = await client.query(SQL`
      SELECT id, name FROM subjects 
      WHERE name = ANY(${subjectNames})
    `);

    if (result.rows.length !== subjectNames.length) {
      const foundSubjects = new Set(result.rows.map((row: { name: string }) => row.name));
      const missingSubjects = subjectNames.filter(name => !foundSubjects.has(name));
      throw new SubjectNotFoundError(`Subjects not found: ${missingSubjects.join(', ')}`);
    }

    return result.rows.map((row: { id: number }) => row.id);
  }

  private async getClassIdByName(client: PoolClient, className: string): Promise<string> {
    const query = SQL`
      SELECT id 
      FROM classes 
      WHERE name = ${className}
    `;

    const { rows } = await client.query(query);
    
    if (rows.length === 0) {
      throw new ServiceError(`Class not found: ${className}`, 'CLASS_NOT_FOUND');
    }

    return rows[0].id;
  }

  private async checkTeacherDuplicates(client: PoolClient, email: string, employeeId: string): Promise<void> {
    // Check for duplicate email
    const { rows: emailCheck } = await client.query(SQL`
      SELECT email FROM teachers WHERE email = ${email}
    `);
    if (emailCheck.length > 0) {
      throw new DuplicateTeacherError('email');
    }

    // Check for duplicate employee ID
    const { rows: employeeIdCheck } = await client.query(SQL`
      SELECT employee_id FROM teachers WHERE employee_id = ${employeeId}
    `);
    if (employeeIdCheck.length > 0) {
      throw new DuplicateTeacherError('employee ID');
    }
  }

  async getTeachers(filters: TeacherFilters = {}): Promise<PaginatedResult<TeacherInput[]>> {
    try {
      this.validateFilters(filters);

      const query = SQL`
        SELECT 
          t.*,
          ARRAY_AGG(DISTINCT s.name) as subjects,
          ARRAY_AGG(DISTINCT c.name) as classes
        FROM teachers t
        LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        LEFT JOIN class_teachers ct ON t.id = ct.teacher_id
        LEFT JOIN classes c ON ct.class_id = c.id
        WHERE 1=1
      `;

      if (filters.status) {
        query.append(SQL` AND t.status = ${filters.status}`);
      }

      if (filters.search) {
        query.append(SQL` AND (
          t.name ILIKE ${`%${filters.search}%`} OR
          t.email ILIKE ${`%${filters.search}%`} OR
          t.employee_id ILIKE ${`%${filters.search}%`} OR
          EXISTS (
            SELECT 1 FROM classes c2
            JOIN class_teachers ct2 ON ct2.class_id = c2.id
            WHERE ct2.teacher_id = t.id AND c2.name ILIKE ${`%${filters.search}%`}
          )
        )`);
      }

      if (filters.class) {
        query.append(SQL` AND EXISTS (
          SELECT 1 FROM classes c2
          JOIN class_teachers ct2 ON ct2.class_id = c2.id
          WHERE ct2.teacher_id = t.id AND c2.name = ${filters.class}
        )`);
      }

      query.append(SQL` GROUP BY t.id`);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) as count_query`;
      const { rows: [{ count }] } = await pool.query(countQuery);

      query.append(SQL` LIMIT ${limit} OFFSET ${offset}`);
      const { rows } = await pool.query(query);

      return {
        data: rows.map(row => ({
          ...row,
          subjects: row.subjects.filter(Boolean),
          class: row.classes?.filter(Boolean)[0] || null
        })),
        total: parseInt(count),
        page,
        limit
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching teachers:', errorMessage);
      throw error;
    }
  }

  async getTeacherByIdentifier(identifier: GetTeacherIdentifier): Promise<ServiceResult<TeacherInput>> {
    try {
      if (!identifier.id && !identifier.employeeId && !identifier.email && !identifier.name) {
        throw new Error('At least one identifier (id, employeeId, email, or name) must be provided');
      }

      const query = SQL`
        SELECT 
          t.*,
          ARRAY_AGG(DISTINCT s.name) as subjects,
          ARRAY_AGG(DISTINCT c.name) as classes
        FROM teachers t
        LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
        LEFT JOIN subjects s ON ts.subject_id = s.id
        LEFT JOIN class_teachers ct ON t.id = ct.teacher_id
        LEFT JOIN classes c ON ct.class_id = c.id
        WHERE 1=1
      `;

      if (identifier.id) {
        query.append(SQL` AND t.id = ${identifier.id}`);
      }
      if (identifier.employeeId) {
        query.append(SQL` AND t.employee_id = ${identifier.employeeId}`);
      }
      if (identifier.email) {
        query.append(SQL` AND t.email = ${identifier.email}`);
      }
      if (identifier.name) {
        query.append(SQL` AND t.name = ${identifier.name}`);
      }

      query.append(SQL` GROUP BY t.id`);

      const { rows } = await pool.query(query);
      if (rows.length === 0) {
        const identifierValue = identifier.id || identifier.employeeId || identifier.email || identifier.name || 'unknown';
        throw new TeacherNotFoundError(identifierValue);
      }

      const teacher = {
        ...rows[0],
        subjects: rows[0].subjects.filter(Boolean),
        class: rows[0].classes?.filter(Boolean)[0] || null
      };

      return { success: true, data: teacher };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching teacher:', errorMessage);
      throw error;
    }
  }

  async createTeacher(data: CreateTeacherData): Promise<ServiceResult<TeacherInput>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate data
      let validatedData;
      try {
        validatedData = TeacherSchema.parse(data);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError' && 'errors' in error) {
          const zodError = error as z.ZodError;
          throw new ServiceError(
            zodError.issues[0].message,
            'VALIDATION_ERROR',
            400
          );
        }
        throw error;
      }

      // Check for duplicates
      await this.checkTeacherDuplicates(client, validatedData.email, validatedData.employeeId);

      // 1. Create teacher record
      const { rows: [teacher] } = await client.query(SQL`
        INSERT INTO teachers (
          name,
          email,
          phone,
          employee_id,
          join_date,
          status
        ) VALUES (
          ${validatedData.name},
          ${validatedData.email},
          ${validatedData.phone},
          ${validatedData.employeeId},
          ${validatedData.joinDate},
          'active'
        )
        RETURNING *
      `);

      // 2. Link teacher to subjects
      if (data.subjects && data.subjects.length > 0) {
        const subjectIds = await this.getSubjectIdsByNames(client, data.subjects);
        for (const subjectId of subjectIds) {
          await client.query(SQL`
            INSERT INTO teacher_subjects (teacher_id, subject_id)
            VALUES (${teacher.id}, ${subjectId})
          `);
        }
      }

      // 3. If class provided, link teacher to class
      if (data.class) {
        const classId = await this.getClassIdByName(client, data.class);
        await client.query(SQL`
          INSERT INTO class_teachers (teacher_id, class_id, is_primary)
          VALUES (${teacher.id}, ${classId}, true)
        `);
      }

      await client.query('COMMIT');

      return await this.getTeacherByIdentifier({ id: teacher.id });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTeacher(id: string, data: UpdateTeacherData): Promise<ServiceResult<TeacherInput>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if teacher exists
      await this.getTeacherByIdentifier({ id });

      // 1. Update basic teacher info
      const updateParts: string[] = [];
      const updateValues: any[] = [id];
      let paramCount = 2;

      if (data.name) {
        updateParts.push(`name = $${paramCount}`);
        updateValues.push(data.name);
        paramCount++;
      }
      if (data.email) {
        updateParts.push(`email = $${paramCount}`);
        updateValues.push(createEmail(data.email));
        paramCount++;
      }
      if (data.phone) {
        updateParts.push(`phone = $${paramCount}`);
        updateValues.push(createPhoneNumber(data.phone));
        paramCount++;
      }
      if (data.employeeId) {
        updateParts.push(`employee_id = $${paramCount}`);
        updateValues.push(data.employeeId);
        paramCount++;
      }
      if (data.joinDate) {
        updateParts.push(`join_date = $${paramCount}`);
        updateValues.push(data.joinDate);
        paramCount++;
      }
      if (data.status) {
        updateParts.push(`status = $${paramCount}`);
        updateValues.push(data.status);
        paramCount++;
      }

      if (updateParts.length > 0) {
        await client.query(
          `UPDATE teachers SET ${updateParts.join(', ')} WHERE id = $1`,
          updateValues
        );
      }

      // 2. Update subjects if provided
      if (data.subjects) {
        // Remove existing subject relationships
        await client.query(SQL`
          DELETE FROM teacher_subjects
          WHERE teacher_id = ${id}
        `);

        // Add new subject relationships
        const subjectIds = await this.getSubjectIdsByNames(client, data.subjects);
        for (const subjectId of subjectIds) {
          await client.query(SQL`
            INSERT INTO teacher_subjects (teacher_id, subject_id)
            VALUES (${id}, ${subjectId})
          `);
        }
      }

      // 3. Update class if provided
      if (data.class) {
        // Remove existing class relationship
        await client.query(SQL`
          DELETE FROM class_teachers
          WHERE teacher_id = ${id}
        `);

        // Add new class relationship
        const classId = await this.getClassIdByName(client, data.class);
        await client.query(SQL`
          INSERT INTO class_teachers (teacher_id, class_id, is_primary)
          VALUES (${id}, ${classId}, true)
        `);
      }

      await client.query('COMMIT');
      return await this.getTeacherByIdentifier({ id });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteTeacher(id: string): Promise<ServiceResult<null>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if teacher exists
      const { rows } = await client.query(SQL`
        SELECT id FROM teachers WHERE id = ${id}
      `);

      if (rows.length === 0) {
        throw new TeacherNotFoundError(id);
      }

      // Delete from junction tables first (should cascade, but being explicit)
      await client.query(SQL`DELETE FROM teacher_subjects WHERE teacher_id = ${id}`);
      await client.query(SQL`DELETE FROM class_teachers WHERE teacher_id = ${id}`);
      
      // Delete teacher
      await client.query(SQL`DELETE FROM teachers WHERE id = ${id}`);

      await client.query('COMMIT');
      logInfo(`Deleted teacher: ${id}`);
      return { success: true, data: null };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const teacherService = TeacherService.getInstance();
