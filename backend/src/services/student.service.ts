import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
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
  studentId: z.string().regex(/^(STU|PAG)\d{3,}$/, 'Student ID must start with STU or PAG followed by numbers'),
  email: z.string().email(),
  class: z.string(),
  parentPhone: z.string().regex(/^\+\d{10,}$/, 'Phone number must be in international format (+1234567890)'),
  dob: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date < new Date();
  }, 'Invalid date of birth'),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Student = z.infer<typeof StudentSchema>;

export interface StudentFilters {
  status?: 'active' | 'inactive';
  class?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface GetStudentIdentifier {
  id?: string;
  studentId?: string;
  email?: string;
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
      AND is_active = true
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
        SELECT DISTINCT
          s.*,
          c.name as class_name
        FROM students s
        LEFT JOIN class_students cs ON s.id = cs.student_id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE TRUE
      `;

      if (filters.status) {
        query.append(SQL` AND s.status = ${filters.status}`);
      }

      if (filters.search) {
        query.append(SQL` AND (
          LOWER(s.name) LIKE LOWER(${`%${filters.search}%`}) OR
          LOWER(s.email) LIKE LOWER(${`%${filters.search}%`}) OR
          LOWER(s.admission_number) LIKE LOWER(${`%${filters.search}%`})
        )`);
      }

      if (filters.class) {
        query.append(SQL` AND c.name = ${filters.class}`);
      }

      // Add ordering with NULLS LAST for consistency
      query.append(SQL` ORDER BY s.name NULLS LAST`);

      // Get total count
      const countQuery = SQL`
        SELECT COUNT(DISTINCT s.id) as count 
        FROM students s
        LEFT JOIN class_students cs ON s.id = cs.student_id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE TRUE
      `;

      // Apply the same filters to count query
      if (filters.status) {
        countQuery.append(SQL` AND s.status = ${filters.status}`);
      }
      if (filters.search) {
        countQuery.append(SQL` AND (
          LOWER(s.name) LIKE LOWER(${`%${filters.search}%`}) OR
          LOWER(s.email) LIKE LOWER(${`%${filters.search}%`}) OR
          LOWER(s.admission_number) LIKE LOWER(${`%${filters.search}%`})
        )`);
      }
      if (filters.class) {
        countQuery.append(SQL` AND c.name = ${filters.class}`);
      }

      const { rows: [{ count }] } = await pool.query(countQuery);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      query.append(SQL` LIMIT ${limit} OFFSET ${offset}`);

      const { rows } = await pool.query(query);

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

  async getStudentByIdentifier(identifier: GetStudentIdentifier): Promise<ServiceResult<Student>> {
    try {
      if (!identifier.id && !identifier.studentId && !identifier.email) {
        throw new Error('At least one identifier (id, studentId, or email) must be provided');
      }

      const query = SQL`
        SELECT 
          s.*,
          c.name as class_name
        FROM students s
        LEFT JOIN class_students cs ON s.id = cs.student_id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE 1=1
      `;

      if (identifier.id) {
        query.append(SQL` AND s.id = ${identifier.id}`);
      }
      if (identifier.studentId) {
        query.append(SQL` AND s.admission_number = ${identifier.studentId}`);
      }
      if (identifier.email) {
        query.append(SQL` AND s.email = ${identifier.email}`);
      }

      const { rows } = await pool.query(query);

      if (rows.length === 0) {
        const identifierValue = identifier.id || identifier.studentId || identifier.email || 'unknown';
        throw new StudentNotFoundError(identifierValue);
      }

      const student = {
        ...rows[0],
        studentId: rows[0].admission_number, // Map admission_number to studentId
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

  private async checkStudentDuplicates(
    client: any, 
    email: string | undefined, 
    studentId: string | undefined, 
    currentId?: string,
    isCreate: boolean = false
  ): Promise<void> {
    // For create operations, both email and studentId are required
    if (isCreate && (!email || !studentId)) {
      throw new ServiceError(
        'Email and student ID are required for new students',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (email) {
      // Check for duplicate email
      const emailQuery = currentId 
        ? SQL`SELECT email FROM students WHERE email = ${email} AND id != ${currentId}`
        : SQL`SELECT email FROM students WHERE email = ${email}`;
        
      const { rows: emailCheck } = await client.query(emailQuery);
      if (emailCheck.length > 0) {
        throw new DuplicateStudentError('email');
      }
    }

    if (studentId) {
      // Check for duplicate student ID
      const studentIdQuery = currentId
        ? SQL`SELECT student_id FROM students WHERE student_id = ${studentId} AND id != ${currentId}`
        : SQL`SELECT student_id FROM students WHERE student_id = ${studentId}`;
        
      const { rows: studentIdCheck } = await client.query(studentIdQuery);
      if (studentIdCheck.length > 0) {
        throw new DuplicateStudentError('student ID');
      }
    }
  }

  async createStudent(data: CreateStudentData): Promise<ServiceResult<Student>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate data with proper type validation
      const validatedData = {
        ...data,
        email: createEmail(data.email),
        parentPhone: createPhoneNumber(data.parentPhone),
      };

      // Validate student ID format
      if (!validatedData.studentId.match(/^(STU|PAG)\d{3,}$/)) {
        throw new ServiceError(
          'Student ID must start with STU or PAG followed by numbers',
          'INVALID_STUDENT_ID',
          400
        );
      }

      // Validate date of birth
      const dob = new Date(validatedData.dob);
      if (isNaN(dob.getTime()) || dob >= new Date()) {
        throw new ServiceError(
          'Invalid date of birth',
          'INVALID_DOB',
          400
        );
      }

      // Check for duplicates
      await this.checkStudentDuplicates(client, validatedData.email, data.studentId, undefined, true);

      // Get class ID
      const classId = await this.getClassIdByName(client, data.class);

      // Generate UUID for consistent ID generation across databases
      const newId = createUUID(uuidv4());

      // Create student record
      const { rows: [student] } = await client.query(SQL`
        INSERT INTO students (
          id, 
          admission_number, 
          name, 
          email, 
          parent_phone,
          dob,
          status,
          created_at, 
          updated_at
        ) VALUES (
          ${newId},
          ${data.studentId},
          ${data.name},
          ${validatedData.email},
          ${validatedData.parentPhone},
          ${data.dob},
          'active',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `);

      // Link student to class
      await client.query(SQL`
        INSERT INTO class_students (student_id, class_id, created_at)
        VALUES (${newId}, ${classId}, CURRENT_TIMESTAMP)
      `);

      await client.query('COMMIT');

      // Fetch complete student data with class information
      const result = await this.getStudentByIdentifier({ id: newId });
      logInfo(`Created student: ${newId}`);
      return result;

    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating student:', errorMessage);
      
      if (error instanceof DuplicateStudentError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Failed to create student', 'CREATE_ERROR');
    } finally {
      client.release();
    }
  }

  async updateStudent(id: string, data: UpdateStudentData): Promise<ServiceResult<Student>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First get the current student data
      const { rows: [currentStudent] } = await client.query(SQL`
        SELECT * FROM students WHERE id = ${id}
      `);

      if (!currentStudent) {
        throw new StudentNotFoundError(id);
      }

      // Validate data with proper type validation
      const validatedData = {
        ...data,
        email: data.email ? createEmail(data.email) : undefined,
        parentPhone: data.parentPhone ? createPhoneNumber(data.parentPhone) : undefined,
      };

      // Validate student ID format if provided
      if (data.studentId && !data.studentId.match(/^(STU|PAG)\d{3,}$/)) {
        throw new ServiceError(
          'Student ID must start with STU or PAG followed by numbers',
          'INVALID_STUDENT_ID',
          400
        );
      }

      // Only check for duplicates if the value is different from current
      if ((validatedData.email && validatedData.email !== currentStudent.email) || 
          (data.studentId && data.studentId !== currentStudent.student_id)) {
        await this.checkStudentDuplicates(
          client,
          validatedData.email !== currentStudent.email ? validatedData.email : undefined,
          data.studentId !== currentStudent.student_id ? data.studentId : undefined,
          id
        );
      }

      // Validate date of birth if provided
      if (data.dob) {
        const dob = new Date(data.dob);
        if (isNaN(dob.getTime()) || dob >= new Date()) {
          throw new ServiceError(
            'Invalid date of birth',
            'INVALID_DOB',
            400
          );
        }
      }

      // Update basic student info
      const updateParts: string[] = [];
      const updateValues: any[] = [id];
      let paramCount = 2;

      if (data.name) {
        updateParts.push(`name = $${paramCount++}`);
        updateValues.push(data.name);
      }
      if (data.studentId) {
        updateParts.push(`admission_number = $${paramCount++}`);
        updateValues.push(data.studentId);
      }
      if (validatedData.email) {
        updateParts.push(`email = $${paramCount++}`);
        updateValues.push(validatedData.email);
      }
      if (validatedData.parentPhone) {
        updateParts.push(`parent_phone = $${paramCount++}`);
        updateValues.push(validatedData.parentPhone);
      }
      if (data.dob) {
        updateParts.push(`dob = $${paramCount++}`);
        updateValues.push(data.dob);
      }
      if (data.status) {
        updateParts.push(`status = $${paramCount++}`);
        updateValues.push(data.status);
      }

      if (updateParts.length > 0) {
        await client.query(
          `UPDATE students SET ${updateParts.join(', ')} WHERE id = $1`,
          updateValues
        );
      }

      // Update class if provided
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
