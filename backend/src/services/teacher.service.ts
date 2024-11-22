import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
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
  updatedAt: z.date()
});

export type Teacher = z.infer<typeof TeacherSchema>;

interface TeacherFilters {
  status?: 'active' | 'inactive';
  search?: string;  // Will match against name, email, or employeeId
  page?: number;
  limit?: number;
}

interface CreateTeacherData {
  name: string;
  employeeId: string;
  email: string;
  subjectIds: string[];
  phone: string;
  joinDate: string;
}

interface UpdateTeacherData {
  name?: string;
  employeeId?: string;
  email?: string;
  subjectIds?: string[];
  phone?: string;
  joinDate?: string;
  status?: 'active' | 'inactive';
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

  async getTeachers(filters: TeacherFilters = {}): Promise<PaginatedResult<Teacher>> {
    try {
      this.validateFilters(filters);

      const query = SQL`
        SELECT 
          t.id,
          t.name,
          t.email,
          t.employee_id as "employeeId",
          t.phone,
          t.status,
          t.join_date as "joinDate",
          t.created_at as "createdAt",
          t.updated_at as "updatedAt",
          json_agg(DISTINCT jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description
          )) as subject_details
        FROM teachers t
        LEFT JOIN subjects s ON s.id = ANY(t.subjects)
        WHERE 1=1
      `;

      if (filters.status) {
        query.append(SQL` AND t.status = ${filters.status}`);
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        query.append(SQL` AND (
          t.name ILIKE ${searchPattern} OR 
          t.email ILIKE ${searchPattern} OR 
          t.employee_id ILIKE ${searchPattern}
        )`);
      }

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) as count_query`;
      const { rows: [{ count }] } = await pool.query(countQuery);
      const total = parseInt(count as string);

      // Add pagination to main query
      query.append(SQL` GROUP BY t.id LIMIT ${limit} OFFSET ${offset}`);

      const { rows: teachers } = await pool.query(query);
      
      return {
        items: teachers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
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
        SELECT * FROM teachers 
        WHERE 1=1
      `;

      if (identifier.id) {
        const uuid = createUUID(identifier.id);
        query.append(SQL` AND id = ${uuid}`);
      }
      if (identifier.employeeId) {
        query.append(SQL` AND employee_id = ${identifier.employeeId}`);
      }
      if (identifier.email) {
        const email = createEmail(identifier.email);
        query.append(SQL` AND email = ${email}`);
      }
      if (identifier.name) {
        query.append(SQL` AND name = ${identifier.name}`);
      }

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

  async createTeacher(data: CreateTeacherData): Promise<ServiceResult<Teacher>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate data
      const validatedData = {
        ...data,
        email: createEmail(data.email),
        phone: createPhoneNumber(data.phone),
        subjectIds: data.subjectIds.map(id => createUUID(id))
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
          name, employee_id, email, phone, subjects, join_date, status
        ) VALUES (
          ${validatedData.name},
          ${validatedData.employeeId},
          ${validatedData.email},
          ${validatedData.phone},
          ${validatedData.subjectIds},
          ${validatedData.joinDate},
          'active'
        )
        RETURNING id
      `;

      const { rows: [{ id }] } = await client.query(query);
      await client.query('COMMIT');

      logInfo(`Created teacher: ${id}`);
      return this.getTeacherByIdentifier({ id });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating teacher:', errorMessage);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTeacher(id: string, data: UpdateTeacherData): Promise<ServiceResult<Teacher>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const uuid = createUUID(id);
      const setValues: ReturnType<typeof SQL>[] = [];
      const queryParts: string[] = [];

      if (data.name !== undefined) {
        queryParts.push('name = ');
        setValues.push(SQL`${data.name}`);
      }
      if (data.employeeId !== undefined) {
        queryParts.push('employee_id = ');
        setValues.push(SQL`${data.employeeId}`);
      }
      if (data.email !== undefined) {
        queryParts.push('email = ');
        setValues.push(SQL`${createEmail(data.email)}`);
      }
      if (data.phone !== undefined) {
        queryParts.push('phone = ');
        setValues.push(SQL`${createPhoneNumber(data.phone)}`);
      }
      if (data.subjectIds !== undefined) {
        queryParts.push('subjects = ');
        setValues.push(SQL`${data.subjectIds.map(id => createUUID(id))}`);
      }
      if (data.joinDate !== undefined) {
        queryParts.push('join_date = ');
        setValues.push(SQL`${data.joinDate}`);
      }
      if (data.status !== undefined) {
        queryParts.push('status = ');
        setValues.push(SQL`${data.status}`);
      }

      if (setValues.length === 0) {
        return this.getTeacherByIdentifier({ id });
      }

      const setClause = queryParts.map((part, i) => part + setValues[i]).join(', ');
      const query = SQL`
        UPDATE teachers 
        SET ${setClause} 
        WHERE id = ${uuid}
        RETURNING id
      `;

      const { rows } = await client.query(query);
      if (rows.length === 0) {
        throw new TeacherNotFoundError(id);
      }

      await client.query('COMMIT');
      logInfo(`Updated teacher: ${id}`);
      return this.getTeacherByIdentifier({ id });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error updating teacher:', errorMessage);
      throw error;
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
