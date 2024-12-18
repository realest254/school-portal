import { PoolClient } from 'pg';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
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

  private async checkTeacherDuplicates(
    client: any, 
    email: string | undefined, 
    employeeId: string | undefined, 
    currentId?: string,
    isCreate: boolean = false
  ): Promise<void> {
    // For create operations, both email and employeeId are required
    if (isCreate && (!email || !employeeId)) {
      throw new ServiceError(
        'Email and employee ID are required for new teachers',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (email) {
      // Check for duplicate email
      const emailQuery = currentId 
        ? SQL`SELECT email FROM teachers WHERE email = ${email} AND id != ${currentId}`
        : SQL`SELECT email FROM teachers WHERE email = ${email}`;
        
      const { rows: emailCheck } = await client.query(emailQuery);
      if (emailCheck.length > 0) {
        throw new DuplicateTeacherError('email');
      }
    }

    if (employeeId) {
      // Check for duplicate employee ID
      const employeeIdQuery = currentId
        ? SQL`SELECT employee_id FROM teachers WHERE employee_id = ${employeeId} AND id != ${currentId}`
        : SQL`SELECT employee_id FROM teachers WHERE employee_id = ${employeeId}`;
        
      const { rows: employeeIdCheck } = await client.query(employeeIdQuery);
      if (employeeIdCheck.length > 0) {
        throw new DuplicateTeacherError('employee ID');
      }
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
      if (!identifier.id && !identifier.employeeId && !identifier.email) {
        throw new Error('At least one identifier (id, employeeId, or email) must be provided');
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

      query.append(SQL` GROUP BY t.id`);

      const { rows } = await pool.query(query);
      if (rows.length === 0) {
        const identifierValue = identifier.id || identifier.employeeId || identifier.email || 'unknown';
        throw new TeacherNotFoundError(identifierValue);
      }

      const teacher = {
        ...rows[0],
        employeeId: rows[0].employee_id,
        subjects: rows[0].subjects.filter(Boolean),
        class: rows[0].classes?.filter(Boolean)[0] || null
      };

      return {
        success: true,
        data: teacher
      };
    } catch (error: unknown) {
      if (error instanceof TeacherNotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching teacher by identifier:', errorMessage);
      throw new ServiceError('Failed to fetch teacher', 'FETCH_ERROR');
    }
  }

  async createTeacher(data: CreateTeacherData): Promise<ServiceResult<TeacherInput>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate data
      let validatedData;
      try {
        validatedData = {
          ...data,
          name: createTeacherName(data.name),
          email: createEmail(data.email),
          phone: createPhoneNumber(data.phone),
          employeeId: createEmployeeId(data.employeeId),
          joinDate: createJoinDate(data.joinDate)
        };
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
      await this.checkTeacherDuplicates(client, validatedData.email, validatedData.employeeId, undefined, true);

      // Validate subjects (no duplicates)
      if (data.subjects) {
        const uniqueSubjects = [...new Set(data.subjects)];
        if (uniqueSubjects.length !== data.subjects.length) {
          throw new ServiceError(
            'Duplicate subjects are not allowed',
            'DUPLICATE_SUBJECTS',
            400
          );
        }
        data.subjects = uniqueSubjects;
      }

      const id = createUUID(uuidv4());

      // 1. Create teacher record
      const { rows: [teacher] } = await client.query(SQL`
        INSERT INTO teachers (
          id,
          name,
          email,
          phone,
          employee_id,
          join_date,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${validatedData.name},
          ${validatedData.email},
          ${validatedData.phone},
          ${validatedData.employeeId},
          ${validatedData.joinDate},
          'active',
          NOW(),
          NOW()
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating teacher:', errorMessage);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTeacher(id: string, data: UpdateTeacherData): Promise<ServiceResult<TeacherInput>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First get the current teacher data
      const { rows: [currentTeacher] } = await client.query(SQL`
        SELECT * FROM teachers WHERE id = ${id}
      `);

      if (!currentTeacher) {
        throw new TeacherNotFoundError(id);
      }

      // Validate data with proper type validation
      const validatedData = {
        ...data,
        email: data.email ? createEmail(data.email) : undefined,
        phone: data.phone ? createPhoneNumber(data.phone) : undefined,
      };

      // Only check for duplicates if the value is different from current
      if ((validatedData.email && validatedData.email !== currentTeacher.email) || 
          (data.employeeId && data.employeeId !== currentTeacher.employee_id)) {
        await this.checkTeacherDuplicates(
          client,
          validatedData.email !== currentTeacher.email ? validatedData.email : undefined,
          data.employeeId !== currentTeacher.employee_id ? data.employeeId : undefined,
          id
        );
      }

      // 1. Update basic teacher info
      if (Object.keys(validatedData).length > 0 || data.status) {
        const updateParts: string[] = [];
        const updateValues: any[] = [id];
        let paramCount = 2;

        if (validatedData.name) {
          updateParts.push(`name = $${paramCount}`);
          updateValues.push(validatedData.name);
          paramCount++;
        }
        if (validatedData.email) {
          updateParts.push(`email = $${paramCount}`);
          updateValues.push(validatedData.email);
          paramCount++;
        }
        if (validatedData.phone) {
          updateParts.push(`phone = $${paramCount}`);
          updateValues.push(validatedData.phone);
          paramCount++;
        }
        if (validatedData.employeeId) {
          updateParts.push(`employee_id = $${paramCount}`);
          updateValues.push(validatedData.employeeId);
          paramCount++;
        }
        if (validatedData.joinDate) {
          updateParts.push(`join_date = $${paramCount}`);
          updateValues.push(validatedData.joinDate);
          paramCount++;
        }
        if (data.status) {
          updateParts.push(`status = $${paramCount}`);
          updateValues.push(data.status);
          paramCount++;
        }

        updateParts.push(`updated_at = NOW()`);

        if (updateParts.length > 0) {
          const updateQuery = `
            UPDATE teachers 
            SET ${updateParts.join(', ')}
            WHERE id = $1
            RETURNING *
          `;
          await client.query(updateQuery, updateValues);
        }
      }

      // 2. Update subjects if provided
      if (data.subjects) {
        // Validate subjects (no duplicates)
        const uniqueSubjects = [...new Set(data.subjects)];
        if (uniqueSubjects.length !== data.subjects.length) {
          throw new ServiceError(
            'Duplicate subjects are not allowed',
            'DUPLICATE_SUBJECTS',
            400
          );
        }
        data.subjects = uniqueSubjects;

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
      if (data.class !== undefined) {
        // Remove existing class relationship
        await client.query(SQL`
          DELETE FROM class_teachers
          WHERE teacher_id = ${id}
        `);

        // Add new class relationship if class is provided (not null)
        if (data.class) {
          const classId = await this.getClassIdByName(client, data.class);
          await client.query(SQL`
            INSERT INTO class_teachers (teacher_id, class_id, is_primary)
            VALUES (${id}, ${classId}, true)
          `);
        }
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

  /**
   * Check if a teacher is assigned to a specific class
   */
  async isTeacherAssignedToClass(teacherEmail: string, className: string): Promise<boolean> {
    try {
      const query = SQL`
        SELECT COUNT(*) as count
        FROM class_teachers ct
        JOIN classes c ON ct.class_id = c.id
        JOIN teachers t ON ct.teacher_id = t.id
        WHERE t.email = ${teacherEmail}
          AND c.name = ${className}
          AND c.is_active = true
      `;

      const { rows } = await pool.query(query);
      return rows[0].count > 0;
    } catch (error) {
      logError(error, 'Error checking teacher class assignment');
      throw new ServiceError('Failed to check teacher class assignment', 'TEACHER_CLASS_CHECK_ERROR');
    }
  }
}

export const teacherService = TeacherService.getInstance();
