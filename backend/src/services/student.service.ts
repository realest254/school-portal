import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const UUIDSchema = z.string().uuid();
const EmailSchema = z.string().email();
const StatusSchema = z.enum(['active', 'inactive']);
const ClassSchema = z.string();

interface StudentFilters {
  status?: string;
  class?: string;
  search?: string;  // Will match against name, email, or admissionNumber
  page?: number;
  limit?: number;
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

interface GetStudentIdentifier {
  id?: string;
  admissionNumber?: string;
  email?: string;
  name?: string;
}

export class StudentService {
  private static validateFilters(filters: StudentFilters) {
    if (filters.status) {
      StatusSchema.parse(filters.status);
    }
    if (filters.class) {
      ClassSchema.parse(filters.class);
    }
    if (filters.page) {
      z.number().positive().parse(filters.page);
    }
    if (filters.limit) {
      z.number().positive().max(100).parse(filters.limit);
    }
  }

  static async getStudents(filters: StudentFilters = {}) {
    try {
      // Validate filters
      this.validateFilters(filters);

      const query = SQL`
        SELECT 
          s.id,
          s.name,
          s.email,
          s.admission_number as "admissionNumber",
          s.class,
          s.parent_phone as "parentPhone",
          s.dob,
          s.status,
          s.created_at as "createdAt",
          s.updated_at as "updatedAt"
        FROM students s
        WHERE 1=1
      `;

      if (filters.status) {
        query.append(SQL` AND s.status = ${filters.status}`);
      }

      if (filters.class) {
        query.append(SQL` AND s.class = ${filters.class}`);
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        query.append(SQL` AND (
          s.name ILIKE ${searchPattern} OR 
          s.email ILIKE ${searchPattern} OR 
          s.admission_number ILIKE ${searchPattern}
        )`);
      }

      // Get total count
      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) AS count`;
      const { rows: [{ count }] } = await pool.query(countQuery);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      query.append(SQL` ORDER BY s.created_at DESC LIMIT ${limit} OFFSET ${offset}`);

      const { rows: students } = await pool.query(query);

      return {
        students,
        pagination: {
          total: parseInt(count),
          page,
          limit
        }
      };
    } catch (error) {
      logError('Error in getStudents:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  static async getStudentByIdentifier(identifier: GetStudentIdentifier) {
    try {
      if (!identifier.id && !identifier.admissionNumber && !identifier.email && !identifier.name) {
        throw new Error('At least one identifier (id, admissionNumber, email, or name) must be provided');
      }

      const query = SQL`
        SELECT 
          s.id,
          s.name,
          s.email,
          s.admission_number as "admissionNumber",
          s.class,
          s.parent_phone as "parentPhone",
          s.dob,
          s.status,
          s.created_at as "createdAt",
          s.updated_at as "updatedAt"
        FROM students s
        WHERE 1=1
      `;

      if (identifier.id) {
        UUIDSchema.parse(identifier.id);
        query.append(SQL` AND s.id = ${identifier.id}`);
      }
      if (identifier.admissionNumber) {
        query.append(SQL` AND s.admission_number = ${identifier.admissionNumber}`);
      }
      if (identifier.email) {
        query.append(SQL` AND s.email = ${identifier.email}`);
      }
      if (identifier.name) {
        query.append(SQL` AND s.name = ${identifier.name}`);
      }

      const { rows: [student] } = await pool.query(query);
      return student;
    } catch (error) {
      logError('Error in getStudentByIdentifier:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  static async createStudent(data: CreateStudentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const StudentSchema = z.object({
        name: z.string(),
        admissionNumber: z.string(),
        email: EmailSchema,
        class: z.string(),
        parentPhone: z.string(),
        dob: z.string().datetime()
      });

      StudentSchema.parse(data);

      const query = SQL`
        INSERT INTO students (
          name, admission_number, email, class, parent_phone, dob, status
        ) VALUES (
          ${data.name}, ${data.admissionNumber}, ${data.email}, 
          ${data.class}, ${data.parentPhone}, ${data.dob}, 'active'
        )
        RETURNING id
      `;

      const { rows: [student] } = await client.query(query);
      await client.query('COMMIT');

      logInfo(`Created student: ${student.id}`);
      return await this.getStudentByIdentifier({ id: student.id });
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error in createStudent:', error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStudent(id: string, data: UpdateStudentData) {
    UUIDSchema.parse(id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const UpdateStudentSchema = z.object({
        name: z.string().optional(),
        admissionNumber: z.string().optional(),
        email: EmailSchema.optional(),
        class: z.string().optional(),
        parentPhone: z.string().optional(),
        dob: z.string().datetime().optional(),
        status: StatusSchema.optional()
      });

      UpdateStudentSchema.parse(data);

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
        queryParts.push('class = ');
        setValues.push(SQL`${data.class}`);
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
        return null;
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
      return await this.getStudentByIdentifier({ id: student.id });
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error in updateStudent:', error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteStudent(id: string) {
    try {
      UUIDSchema.parse(id);

      const query = SQL`
        DELETE FROM students 
        WHERE id = ${id} 
        RETURNING id
      `;
      
      const { rows: [student] } = await pool.query(query);
      
      if (student) {
        logInfo(`Deleted student: ${id}`);
      }
      return student;
    } catch (error) {
      logError('Error in deleteStudent:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
