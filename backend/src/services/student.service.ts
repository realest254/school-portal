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
  admissionNumber: z.string().min(3).max(20),
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
  admissionNumber: string;
  email: string;
  class: string;
  parentPhone: string;
  dob: string;
}

interface UpdateStudentData {
  name?: string;
  admissionNumber?: string;
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
  }

  async getStudents(filters: StudentFilters = {}): Promise<PaginatedResult<Student[]>> {
    try {
      const query = SQL`
        SELECT s.*, c.name as class_name 
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE 1=1
      `;

      if (filters.status) {
        query.append(SQL` AND s.status = ${filters.status}`);
      }

      if (filters.search) {
        query.append(SQL` AND (
          s.name ILIKE ${`%${filters.search}%`} OR
          s.email ILIKE ${`%${filters.search}%`} OR
          s.admission_number ILIKE ${`%${filters.search}%`}
        )`);
      }

      if (filters.class) {
        query.append(SQL` AND c.name = ${filters.class}`);
      }

      // Add ordering
      query.append(SQL` ORDER BY s.name`);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) as count_query`;
      const { rows: [{ count }] } = await pool.query(countQuery);

      query.append(SQL` LIMIT ${limit} OFFSET ${offset}`);
      const { rows } = await pool.query(query);

      if (rows.length === 0 && filters.class) {
        throw new ServiceError(`No students found in class: ${filters.class}`, 'NO_STUDENTS_FOUND', 404);
      }

      const students = rows.map(row => ({
        ...row,
        class: row.class_name // Map the joined class_name back to class for backward compatibility
      }));

      return {
        data: students,
        total: parseInt(count),
        page,
        limit
      };
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching students:', errorMessage);
      throw new ServiceError('Failed to fetch students', 'FETCH_ERROR');
    }
  }

  /**
   * Get a student by identifier (id, admission number, or email)
   */
  async getStudentByIdentifier(identifier: { id?: string; admissionNumber?: string; email?: string }): Promise<ServiceResult<Student>> {
    try {
      const query = SQL`
        SELECT s.*, c.name as class_name 
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE 1=0
      `;

      if (identifier.id) {
        query.append(SQL` OR s.id = ${identifier.id}`);
      }
      if (identifier.admissionNumber) {
        query.append(SQL` OR s.admission_number = ${identifier.admissionNumber}`);
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
        class: rows[0].class_name // Map the joined class_name back to class for backward compatibility
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

  async createStudent(data: CreateStudentData): Promise<ServiceResult<Student>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get class_id from class name
      const { rows: [classRow] } = await client.query(SQL`
        SELECT id FROM classes WHERE name = ${data.class}
      `);

      if (!classRow) {
        throw new ServiceError(`Class "${data.class}" not found`, 'CLASS_NOT_FOUND', 404);
      }

      // Validate data schema
      const StudentSchema = z.object({
        name: z.string().min(2).max(100),
        admissionNumber: z.string().min(3).max(20),
        email: z.string().email(),
        class: z.string(),
        parentPhone: z.string().regex(/^\+?[\d\s-()]{10,}$/),
        dob: z.string().datetime()
      });

      StudentSchema.parse(data);

      // Check for duplicate email or admission number
      const existingStudent = await this.getStudentByIdentifier({
        email: data.email,
        admissionNumber: data.admissionNumber
      }).catch(() => null);

      if (existingStudent?.data) {
        throw new DuplicateStudentError(
          existingStudent.data.email === data.email ? 'email' : 'admission number'
        );
      }

      const query = SQL`
        INSERT INTO students (
          name, admission_number, email, class_id, parent_phone, dob, status
        ) VALUES (
          ${data.name}, ${data.admissionNumber}, ${data.email}, 
          ${classRow.id}, ${data.parentPhone}, ${data.dob}, 'active'
        )
        RETURNING id
      `;

      const { rows: [student] } = await client.query(query);
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
      const existingStudent = await this.getStudentByIdentifier({ id });

      // Validate update data
      const UpdateStudentSchema = z.object({
        name: z.string().min(2).max(100).optional(),
        admissionNumber: z.string().min(3).max(20).optional(),
        email: z.string().email().optional(),
        class: z.string().optional(),
        parentPhone: z.string().regex(/^\+?[\d\s-()]{10,}$/).optional(),
        dob: z.string().datetime().optional(),
        status: z.enum(['active', 'inactive']).optional()
      });

      UpdateStudentSchema.parse(data);

      // Check for duplicates if email or admission number is being updated
      if (data.email || data.admissionNumber) {
        const duplicateCheck = await this.getStudentByIdentifier({
          email: data.email,
          admissionNumber: data.admissionNumber
        }).catch(() => null);

        if (duplicateCheck?.data && duplicateCheck.data.id !== id) {
          throw new DuplicateStudentError(
            duplicateCheck.data.email === data.email ? 'email' : 'admission number'
          );
        }
      }

      const setValues: ReturnType<typeof SQL>[] = [];
      const queryParts: string[] = [];

      if (data.name !== undefined) {
        queryParts.push('name = ');
        setValues.push(SQL`${data.name}`);
      }
      if (data.admissionNumber !== undefined) {
        queryParts.push('admission_number = ');
        setValues.push(SQL`${data.admissionNumber}`);
      }
      if (data.email !== undefined) {
        queryParts.push('email = ');
        setValues.push(SQL`${data.email}`);
      }
      if (data.class !== undefined) {
        // Get class_id from class name
        const { rows: [classRow] } = await client.query(SQL`
          SELECT id FROM classes WHERE name = ${data.class}
        `);

        if (!classRow) {
          throw new ServiceError(`Class "${data.class}" not found`, 'CLASS_NOT_FOUND', 404);
        }

        queryParts.push('class_id = ');
        setValues.push(SQL`${classRow.id}`);
      }
      if (data.parentPhone !== undefined) {
        queryParts.push('parent_phone = ');
        setValues.push(SQL`${data.parentPhone}`);
      }
      if (data.dob !== undefined) {
        queryParts.push('dob = ');
        setValues.push(SQL`${data.dob}`);
      }
      if (data.status !== undefined) {
        queryParts.push('status = ');
        setValues.push(SQL`${data.status}`);
      }

      if (setValues.length === 0) {
        return this.getStudentByIdentifier({ id });
      }

      const setClause = queryParts.map((part, i) => part + setValues[i]).join(', ');
      const query = SQL`
        UPDATE students 
        SET ${setClause} 
        WHERE id = ${id}
        RETURNING id
      `;

      const { rows: [student] } = await client.query(query);
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
    try {
      const uuid = createUUID(id);

      const query = SQL`
        DELETE FROM students 
        WHERE id = ${uuid} 
        RETURNING id
      `;
      
      const { rows: [student] } = await pool.query(query);
      
      if (student) {
        logInfo(`Deleted student: ${id}`);
      }
      return { success: true, data: null };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error deleting student:', errorMessage);
      throw new ServiceError(
        'Failed to delete student',
        'DELETE_STUDENT_FAILED',
        500
      );
    }
  }
}

export const studentService = StudentService.getInstance();
