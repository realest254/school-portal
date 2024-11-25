import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import {
  UUID,
  Email,
  PhoneNumber,
  ServiceError,
  ServiceResult,
  PaginationParams,
  PaginatedResult,
  createUUID,
  createEmail,
  createPhoneNumber,
} from '../types/common.types';

// Student-specific error types
export class StudentNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`Student not found: ${identifier}`, 'STUDENT_NOT_FOUND', 404);
  }
}

export class DuplicateStudentError extends ServiceError {
  constructor(field: string) {
    super(`Student with this ${field} already exists`, 'DUPLICATE_STUDENT', 409);
  }
}

// Validation schemas
const StudentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  studentId: z.string().min(3).max(20),
  email: z.string().email(),
  class: z.string(),
  parentPhone: z.string().regex(/^\+?[\d\s-()]{10,}$/),
  dob: z.string().datetime(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Student = z.infer<typeof StudentSchema>;

interface StudentFilters extends PaginationParams {
  status?: 'active' | 'inactive';
  class?: string;
  search?: string;
}

interface CreateStudentData {
  name: string;
  studentId: string;
  email: string;
  class: string;
  parentPhone: string;
  dob: string;
}

interface UpdateStudentData {
  name?: string;
  studentId?: string;
  email?: string;
  class?: string;
  parentPhone?: string;
  dob?: string;
  status?: 'active' | 'inactive';
}

export class StudentService {
  private static instance: StudentService;
  private constructor() {}

  static getInstance(): StudentService {
    if (!StudentService.instance) {
      StudentService.instance = new StudentService();
    }
    return StudentService.instance;
  }

  private static validateFilters(filters: StudentFilters): void {
    if (filters.status) {
      z.enum(['active', 'inactive']).parse(filters.status);
    }
    if (filters.class) {
      z.string().min(1).max(20).parse(filters.class);
    }
    if (filters.search) {
      z.string().max(100).parse(filters.search);
    }
    if (filters.page) {
      z.number().positive().parse(filters.page);
    }
    if (filters.limit) {
      z.number().positive().max(100).parse(filters.limit);
    }
  }

  private async getClassIdByName(client: any, className: string): Promise<string> {
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

  async getStudents(filters: StudentFilters = {}): Promise<PaginatedResult<Student[]>> {
    try {
      StudentService.validateFilters(filters);

      const query = SQL`
        SELECT 
          s.*,
          c.name as class_name
        FROM students s
        LEFT JOIN class_students cs ON s.id = cs.student_id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE 1=1
      `;

      if (filters.status) {
        query.append(SQL` AND s.status = ${filters.status}`);
      }

      if (filters.search) {
        query.append(SQL` AND (
          s.name ILIKE ${`%${filters.search}%`} OR
          s.email ILIKE ${`%${filters.search}%`} OR
          s.student_id ILIKE ${`%${filters.search}%`}
        )`);
      }

      if (filters.class) {
        query.append(SQL` AND c.name = ${filters.class}`);
      }

      // Add ordering
      query.append(SQL` ORDER BY s.name`);

      // Get total count
      const countQuery = SQL`SELECT COUNT(*) as count FROM (${query}) as subquery`;
      const { rows: [{ count }] } = await pool.query(countQuery);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      query.append(SQL` LIMIT ${limit} OFFSET ${offset}`);

      const { rows } = await pool.query(query);

      if (rows.length === 0 && filters.class) {
        throw new ServiceError(`No students found in class: ${filters.class}`, 'NO_STUDENTS_FOUND', 404);
      }

      const students = rows.map(row => ({
        ...row,
        class: row.class_name
      }));

      return {
        data: students,
        total: Number(count),
        page,
        limit
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching students:', errorMessage);
      throw new ServiceError('Failed to fetch students', 'FETCH_ERROR');
    }
  }

  async getStudentByIdentifier(identifier: { id?: string; studentId?: string; email?: string }): Promise<ServiceResult<Student>> {
    try {
      const query = SQL`
        SELECT 
          s.*,
          c.name as class_name
        FROM students s
        LEFT JOIN class_students cs ON s.id = cs.student_id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE 1=0
      `;

      if (identifier.id) {
        query.append(SQL` OR s.id = ${identifier.id}`);
      }
      if (identifier.studentId) {
        query.append(SQL` OR s.student_id = ${identifier.studentId}`);
      }
      if (identifier.email) {
        query.append(SQL` OR s.email = ${identifier.email}`);
      }

      const { rows } = await pool.query(query);

      if (rows.length === 0) {
        throw new StudentNotFoundError(Object.values(identifier)[0]);
      }

      const student = {
        ...rows[0],
        class: rows[0].class_name
      };

      return {
        success: true,
        data: student
      };
    } catch (error: unknown) {
      if (error instanceof StudentNotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching student by identifier:', errorMessage);
      throw new ServiceError('Failed to fetch student', 'FETCH_ERROR');
    }
  }

  private async checkStudentDuplicates(client: any, email: string, studentId: string): Promise<void> {
    // Check for duplicate email
    const { rows: emailCheck } = await client.query(SQL`
      SELECT email FROM students WHERE email = ${email}
    `);
    if (emailCheck.length > 0) {
      throw new DuplicateStudentError('email');
    }

    // Check for duplicate student ID
    const { rows: studentIdCheck } = await client.query(SQL`
      SELECT student_id FROM students WHERE student_id = ${studentId}
    `);
    if (studentIdCheck.length > 0) {
      throw new DuplicateStudentError('student ID');
    }
  }

  async createStudent(data: CreateStudentData): Promise<ServiceResult<Student>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check for duplicates
      await this.checkStudentDuplicates(client, data.email, data.studentId);

      // Get class ID
      const classId = await this.getClassIdByName(client, data.class);

      // Validate data schema
      const CreateStudentSchema = z.object({
        name: z.string().min(2).max(100),
        studentId: z.string().min(3).max(20),
        email: z.string().email(),
        class: z.string(),
        parentPhone: z.string().regex(/^\+?[\d\s-()]{10,}$/),
        dob: z.string().datetime()
      });

      CreateStudentSchema.parse(data);

      // 1. Create student record
      const { rows: [student] } = await client.query(SQL`
        INSERT INTO students (
          name, student_id, email, parent_phone, dob, status
        ) VALUES (
          ${data.name}, ${data.studentId}, ${data.email}, 
          ${data.parentPhone}, ${data.dob}, 'active'
        )
        RETURNING id
      `);

      // 2. Link student to class
      await client.query(SQL`
        INSERT INTO class_students (student_id, class_id)
        VALUES (${student.id}, ${classId})
      `);

      await client.query('COMMIT');

      logInfo(`Created student: ${student.id}`);
      return await this.getStudentByIdentifier({ id: student.id });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating student:', errorMessage);
      
      if (error instanceof DuplicateStudentError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ServiceError('Invalid student data', 'INVALID_STUDENT_DATA', 400);
      }
      throw new ServiceError(
        'Failed to create student',
        'CREATE_STUDENT_FAILED',
        500
      );
    } finally {
      client.release();
    }
  }

  async updateStudent(id: string, data: UpdateStudentData): Promise<ServiceResult<Student>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if student exists
      await this.getStudentByIdentifier({ id });

      // Validate update data
      const UpdateStudentSchema = z.object({
        name: z.string().min(2).max(100).optional(),
        studentId: z.string().min(3).max(20).optional(),
        email: z.string().email().optional(),
        class: z.string().optional(),
        parentPhone: z.string().regex(/^\+?[\d\s-()]{10,}$/).optional(),
        dob: z.string().datetime().optional(),
        status: z.enum(['active', 'inactive']).optional()
      });

      UpdateStudentSchema.parse(data);

      // Check for duplicates if email or student ID is being updated
      if (data.email || data.studentId) {
        await this.checkStudentDuplicates(client, data.email || '', data.studentId || '');
      }

      // 1. Update basic student info
      const updateParts: string[] = [];
      const updateValues: any[] = [id];
      let paramCount = 2;

      if (data.name) {
        updateParts.push(`name = $${paramCount}`);
        updateValues.push(data.name);
        paramCount++;
      }
      if (data.studentId) {
        updateParts.push(`student_id = $${paramCount}`);
        updateValues.push(data.studentId);
        paramCount++;
      }
      if (data.email) {
        updateParts.push(`email = $${paramCount}`);
        updateValues.push(data.email);
        paramCount++;
      }
      if (data.parentPhone) {
        updateParts.push(`parent_phone = $${paramCount}`);
        updateValues.push(data.parentPhone);
        paramCount++;
      }
      if (data.dob) {
        updateParts.push(`dob = $${paramCount}`);
        updateValues.push(data.dob);
        paramCount++;
      }
      if (data.status) {
        updateParts.push(`status = $${paramCount}`);
        updateValues.push(data.status);
        paramCount++;
      }

      if (updateParts.length > 0) {
        await client.query(
          `UPDATE students SET ${updateParts.join(', ')} WHERE id = $1`,
          updateValues
        );
      }

      // 2. Update class if provided
      if (data.class) {
        const classId = await this.getClassIdByName(client, data.class);
        
        // Remove existing class relationship
        await client.query(SQL`
          DELETE FROM class_students
          WHERE student_id = ${id}
        `);

        // Add new class relationship
        await client.query(SQL`
          INSERT INTO class_students (student_id, class_id)
          VALUES (${id}, ${classId})
        `);
      }

      await client.query('COMMIT');

      logInfo(`Updated student: ${id}`);
      return await this.getStudentByIdentifier({ id });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error updating student:', errorMessage);

      if (error instanceof StudentNotFoundError || error instanceof DuplicateStudentError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ServiceError('Invalid student data', 'INVALID_STUDENT_DATA', 400);
      }
      throw new ServiceError(
        'Failed to update student',
        'UPDATE_STUDENT_FAILED',
        500
      );
    } finally {
      client.release();
    }
  }

  async deleteStudent(id: string): Promise<ServiceResult<null>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if student exists
      const { rows } = await client.query(SQL`
        SELECT id FROM students WHERE id = ${id}
      `);

      if (rows.length === 0) {
        throw new StudentNotFoundError(id);
      }

      // Delete from junction tables first (should cascade, but being explicit)
      await client.query(SQL`DELETE FROM class_students WHERE student_id = ${id}`);
      
      // Delete student
      await client.query(SQL`DELETE FROM students WHERE id = ${id}`);

      await client.query('COMMIT');
      logInfo(`Deleted student: ${id}`);
      return { success: true, data: null };

    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const studentService = StudentService.getInstance();
