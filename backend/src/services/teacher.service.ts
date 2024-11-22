import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL, { SQLStatement } from 'sql-template-strings';
import { z } from 'zod';
import { 
  ServiceError, 
  ServiceResult, 
  PaginatedResult, 
  UUID, 
  Email, 
  PhoneNumber,
  createUUID,
  createEmail,
  createPhoneNumber
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

// Validation schemas
const TeacherSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  employeeId: z.string().min(3).max(20),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-()]{10,}$/),
  subjectIds: z.array(z.string().uuid()),
  joinDate: z.string().datetime(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date(),
  classId: z.string().uuid().optional(),
  className: z.string().optional()
});

export type Teacher = z.infer<typeof TeacherSchema>;

interface TeacherFilters {
  status?: 'active' | 'inactive';
  search?: string;  // Will match against name, email, or employeeId
  class?: string;
  page?: number;
  limit?: number;
}

interface CreateTeacherData {
  name: string;
  employeeId: string;
  email: string;
  subjects: string[];
  phone: string;
  joinDate: string;
  class?: string;
}

interface UpdateTeacherData {
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

  async getTeachers(filters: TeacherFilters = {}): Promise<PaginatedResult<Teacher[]>> {
    try {
      this.validateFilters(filters);

      const query = SQL`
        SELECT t.*, c.name as class_name, 
               ARRAY_AGG(s.name) as subject_names
        FROM teachers t
        LEFT JOIN classes c ON t.class_id = c.id
        LEFT JOIN subjects s ON s.id = ANY(t.subjects)
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
          c.name ILIKE ${`%${filters.search}%`}
        )`);
      }

      if (filters.class) {
        query.append(SQL` AND c.name = ${filters.class}`);
      }

      query.append(SQL` GROUP BY t.id, c.name`);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) as count_query`;
      const { rows: [{ count }] } = await pool.query(countQuery);

      query.append(SQL` LIMIT ${limit} OFFSET ${offset}`);
      const { rows } = await pool.query(query);

      const teachers = rows.map(row => ({
        ...row,
        class: row.class_name // Map the joined class_name back to class for backward compatibility
      }));

      return {
        data: teachers,
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

  async getTeacherByIdentifier(identifier: GetTeacherIdentifier): Promise<ServiceResult<Teacher>> {
    try {
      if (!identifier.id && !identifier.employeeId && !identifier.email && !identifier.name) {
        throw new Error('At least one identifier (id, employeeId, email, or name) must be provided');
      }

      const query = SQL`
        SELECT t.*, c.name as class_name, 
               ARRAY_AGG(s.name) as subject_names
        FROM teachers t
        LEFT JOIN classes c ON t.class_id = c.id
        LEFT JOIN subjects s ON s.id = ANY(t.subjects)
        WHERE 1=1
      `;

      if (identifier.id) {
        const uuid = createUUID(identifier.id);
        query.append(SQL` AND t.id = ${uuid}`);
      }
      if (identifier.employeeId) {
        query.append(SQL` AND t.employee_id = ${identifier.employeeId}`);
      }
      if (identifier.email) {
        const email = createEmail(identifier.email);
        query.append(SQL` AND t.email = ${email}`);
      }
      if (identifier.name) {
        query.append(SQL` AND t.name = ${identifier.name}`);
      }

      query.append(SQL` GROUP BY t.id, c.name`);

      const { rows } = await pool.query(query);
      if (rows.length === 0) {
        const identifierValue = identifier.id || identifier.employeeId || identifier.email || identifier.name || 'unknown';
        throw new TeacherNotFoundError(identifierValue);
      }

      const teacher = TeacherSchema.parse(rows[0]);
      return { success: true, data: teacher };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching teacher:', errorMessage);
      throw error;
    }
  }

  /**
   * Convert subject names to IDs
   */
  private async getSubjectIds(subjectNames: string[]): Promise<string[]> {
    try {
      const query = SQL`
        SELECT id, name 
        FROM subjects 
        WHERE name = ANY(${subjectNames})
      `;

      const { rows } = await pool.query(query);
      
      if (rows.length !== subjectNames.length) {
        const foundNames = rows.map(row => row.name);
        const notFound = subjectNames.filter(name => !foundNames.includes(name));
        throw new ServiceError(`Some subjects not found: ${notFound.join(', ')}`, 'SUBJECTS_NOT_FOUND');
      }

      return rows.map(row => row.id);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Failed to fetch subject IDs', 'FETCH_ERROR');
    }
  }

  async createTeacher(data: CreateTeacherData): Promise<ServiceResult<Teacher>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Convert subject names to IDs
      const subjectIds = await this.getSubjectIds(data.subjects);

      // Get class ID from name
      let classId = null;
      if (data.class) {
        const { rows: [classRow] } = await client.query(SQL`
          SELECT id FROM classes WHERE name = ${data.class}
        `);
        
        if (!classRow) {
          throw new ServiceError(`Class not found: ${data.class}`, 'CLASS_NOT_FOUND');
        }
        classId = classRow.id;
      }

      // Validate data
      const validatedData = {
        ...data,
        email: createEmail(data.email),
        phone: createPhoneNumber(data.phone),
      };

      // Check if email or employeeId already exists
      const existingTeacher = await this.getTeacherByIdentifier({
        email: validatedData.email,
        employeeId: validatedData.employeeId
      }).catch(() => null);

      if (existingTeacher?.data) {
        throw new DuplicateTeacherError(
          existingTeacher.data.email === validatedData.email ? 'email' : 'employee ID'
        );
      }

      const query = SQL`
        INSERT INTO teachers (
          name,
          email,
          phone,
          employee_id,
          subjects,
          class_id,
          join_date,
          status
        ) VALUES (
          ${validatedData.name},
          ${validatedData.email},
          ${validatedData.phone},
          ${validatedData.employeeId},
          ${subjectIds},
          ${classId},
          ${validatedData.joinDate},
          'active'
        )
        RETURNING *
      `;

      const { rows: [teacher] } = await client.query(query);
      await client.query('COMMIT');

      return await this.getTeacherByIdentifier({ id: teacher.id });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (error instanceof ServiceError) throw error;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating teacher:', errorMessage);
      
      if (errorMessage.includes('unique constraint')) {
        if (errorMessage.includes('email')) {
          throw new DuplicateTeacherError('email');
        }
        if (errorMessage.includes('employee_id')) {
          throw new DuplicateTeacherError('employee ID');
        }
      }
      
      throw new ServiceError('Failed to create teacher', 'CREATE_ERROR');
    } finally {
      client.release();
    }
  }

  async updateTeacher(id: string, data: UpdateTeacherData): Promise<ServiceResult<Teacher>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if teacher exists
      await this.getTeacherByIdentifier({ id });

      const updateParts: string[] = [];
      const updateValues: SQLStatement[] = [];

      if (data.name) {
        updateParts.push('name = ');
        updateValues.push(SQL`${data.name}`);
      }

      if (data.email) {
        updateParts.push('email = ');
        updateValues.push(SQL`${data.email}`);
      }

      if (data.phone) {
        updateParts.push('phone = ');
        updateValues.push(SQL`${data.phone}`);
      }

      if (data.employeeId) {
        updateParts.push('employee_id = ');
        updateValues.push(SQL`${data.employeeId}`);
      }

      if (data.subjects) {
        const subjectIds = await this.getSubjectIds(data.subjects);
        updateParts.push('subjects = ');
        updateValues.push(SQL`${subjectIds}`);
      }

      if (data.class) {
        const { rows: [classRow] } = await client.query(SQL`
          SELECT id FROM classes WHERE name = ${data.class}
        `);
        
        if (!classRow) {
          throw new ServiceError(`Class not found: ${data.class}`, 'CLASS_NOT_FOUND');
        }

        updateParts.push('class_id = ');
        updateValues.push(SQL`${classRow.id}`);
      }

      if (data.status) {
        updateParts.push('status = ');
        updateValues.push(SQL`${data.status}`);
      }

      if (updateParts.length === 0) {
        return this.getTeacherByIdentifier({ id });
      }

      const setClause = updateParts.map((part, i) => part + updateValues[i].text).join(', ');
      const query = SQL`
        UPDATE teachers 
        SET ${setClause}
        WHERE id = ${id}
        RETURNING *
      `;

      const { rows: [teacher] } = await client.query(query);
      await client.query('COMMIT');

      return await this.getTeacherByIdentifier({ id: teacher.id });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (error instanceof ServiceError) throw error;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error updating teacher:', errorMessage);
      
      if (errorMessage.includes('unique constraint')) {
        if (errorMessage.includes('email')) {
          throw new DuplicateTeacherError('email');
        }
        if (errorMessage.includes('employee_id')) {
          throw new DuplicateTeacherError('employee ID');
        }
      }
      
      throw new ServiceError('Failed to update teacher', 'UPDATE_ERROR');
    } finally {
      client.release();
    }
  }

  async deleteTeacher(id: string): Promise<ServiceResult<null>> {
    try {
      const uuid = createUUID(id);
      const { rows } = await pool.query(SQL`
        DELETE FROM teachers WHERE id = ${uuid}
        RETURNING id
      `);

      if (rows.length === 0) {
        throw new TeacherNotFoundError(id);
      }

      logInfo(`Deleted teacher: ${id}`);
      return { success: true, data: null };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error deleting teacher:', errorMessage);
      throw error;
    }
  }
}

export const teacherService = TeacherService.getInstance();
