import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const UUIDSchema = z.string().uuid();
const EmailSchema = z.string().email();
const StatusSchema = z.enum(['active', 'inactive']);
const PhoneSchema = z.string();
const SubjectsSchema = z.array(z.string());

interface TeacherFilters {
  status?: string;
  subject?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateTeacherData {
  name: string;
  employeeId: string;
  email: string;
  subject: string;
  phone: string;
  joinDate: string;
}

interface UpdateTeacherData {
  name?: string;
  employeeId?: string;
  email?: string;
  subject?: string;
  phone?: string;
  joinDate?: string;
  status?: 'active' | 'inactive';
}

export class TeacherService {
  private static validateFilters(filters: TeacherFilters) {
    if (filters.status) {
      StatusSchema.parse(filters.status);
    }
    if (filters.subject) {
      z.string().parse(filters.subject);
    }
    if (filters.page) {
      z.number().positive().parse(filters.page);
    }
    if (filters.limit) {
      z.number().positive().max(100).parse(filters.limit);
    }
  }

  static async getTeachers(filters: TeacherFilters = {}) {
    try {
      // Validate filters
      this.validateFilters(filters);

      const query = SQL`SELECT * FROM teachers WHERE 1=1`;

      if (filters.status) {
        query.append(SQL` AND status = ${filters.status}`);
      }

      if (filters.subject) {
        query.append(SQL` AND ${filters.subject} = ANY(subjects)`);
      }

      if (filters.search) {
        const searchPattern = `%${filters.search}%`;
        query.append(SQL` AND (name ILIKE ${searchPattern} OR email ILIKE ${searchPattern} OR employee_id ILIKE ${searchPattern})`);
      }

      // Get total count
      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) AS count`;
      const { rows: [{ count }] } = await pool.query(countQuery);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      query.append(SQL` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);

      const { rows: teachers } = await pool.query(query);

      return {
        teachers,
        total: parseInt(count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(count) / limit)
      };
    } catch (error) {
      logError(error, 'TeacherService.getTeachers');
      throw error;
    }
  }

  static async getTeacherById(id: string) {
    try {
      // Validate UUID
      UUIDSchema.parse(id);

      const query = SQL`
        SELECT * FROM teachers 
        WHERE id = ${id}
      `;
      const { rows: [teacher] } = await pool.query(query);
      return teacher;
    } catch (error) {
      logError(error, 'TeacherService.getTeacherById');
      throw error;
    }
  }

  static async createTeacher(data: CreateTeacherData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate input data
      const TeacherSchema = z.object({
        name: z.string(),
        email: EmailSchema,
        phone: PhoneSchema,
        subject: z.string(),
        employeeId: z.string(),
        joinDate: z.string()
      });

      TeacherSchema.parse(data);

      const query = SQL`
        INSERT INTO teachers (
          name, email, phone, subject, employee_id, join_date, status
        ) VALUES (
          ${data.name}, ${data.email}, ${data.phone}, ${data.subject}, 
          ${data.employeeId}, ${data.joinDate}, 'active'
        )
        RETURNING *
      `;

      const { rows: [teacher] } = await client.query(query);
      await client.query('COMMIT');

      logInfo(`Created teacher: ${teacher.id}`);
      return teacher;
    } catch (error) {
      await client.query('ROLLBACK');
      logError(error, 'TeacherService.createTeacher');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateTeacher(id: string, data: UpdateTeacherData) {
    // Validate UUID
    UUIDSchema.parse(id);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate update data
      const UpdateTeacherSchema = z.object({
        name: z.string().optional(),
        email: EmailSchema.optional(),
        phone: PhoneSchema.optional(),
        subject: z.string().optional(),
        employeeId: z.string().optional(),
        joinDate: z.string().optional(),
        status: StatusSchema.optional()
      });

      UpdateTeacherSchema.parse(data);

      const setValues: ReturnType<typeof SQL>[] = [];
      const queryParts: string[] = [];

      if (data.name !== undefined) {
        queryParts.push('name = ');
        setValues.push(SQL`${data.name}`);
      }
      if (data.email !== undefined) {
        queryParts.push('email = ');
        setValues.push(SQL`${data.email}`);
      }
      if (data.phone !== undefined) {
        queryParts.push('phone = ');
        setValues.push(SQL`${data.phone}`);
      }
      if (data.subject !== undefined) {
        queryParts.push('subject = ');
        setValues.push(SQL`${data.subject}`);
      }
      if (data.employeeId !== undefined) {
        queryParts.push('employee_id = ');
        setValues.push(SQL`${data.employeeId}`);
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
        return null;
      }

      const setClause = queryParts.map((part, i) => part + setValues[i]).join(', ');
      const query = SQL`
        UPDATE teachers 
        SET ${setClause} 
        WHERE id = ${id}
        RETURNING *
      `;

      const { rows: [teacher] } = await client.query(query);
      await client.query('COMMIT');

      logInfo(`Updated teacher: ${id}`);
      return teacher;
    } catch (error) {
      await client.query('ROLLBACK');
      logError(error, 'TeacherService.updateTeacher');
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteTeacher(id: string) {
    try {
      // Validate UUID
      UUIDSchema.parse(id);

      const query = SQL`
        DELETE FROM teachers 
        WHERE id = ${id} 
        RETURNING *
      `;
      const { rows: [teacher] } = await pool.query(query);

      if (teacher) {
        logInfo(`Deleted teacher: ${id}`);
      }
      return teacher;
    } catch (error) {
      logError(error, 'TeacherService.deleteTeacher');
      throw error;
    }
  }
}
