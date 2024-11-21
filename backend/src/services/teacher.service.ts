import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const UUIDSchema = z.string().uuid();
const EmailSchema = z.string().email();
const StatusSchema = z.enum(['active', 'inactive']);
const PhoneSchema = z.string();
const SubjectsSchema = z.array(z.string().uuid());

interface TeacherFilters {
  status?: string;
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
  private static validateFilters(filters: TeacherFilters) {
    if (filters.status) {
      StatusSchema.parse(filters.status);
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

      query.append(SQL` GROUP BY t.id, t.name, t.email, t.employee_id, t.phone, t.status, t.join_date, t.created_at, t.updated_at`);

      // Get total count
      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) AS count`;
      const { rows: [{ count }] } = await pool.query(countQuery);

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      query.append(SQL` ORDER BY t.created_at DESC LIMIT ${limit} OFFSET ${offset}`);

      const { rows: teachers } = await pool.query(query);
      
      return {
        teachers,
        pagination: {
          total: parseInt(count),
          page,
          limit
        }
      };
    } catch (error) {
      logError('Error in getTeachers:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  static async getTeacherByIdentifier(identifier: GetTeacherIdentifier) {
    try {
      if (!identifier.id && !identifier.employeeId && !identifier.email && !identifier.name) {
        throw new Error('At least one identifier (id, employeeId, email, or name) must be provided');
      }

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

      query.append(SQL` GROUP BY t.id, t.name, t.email, t.employee_id, t.phone, t.status, t.join_date, t.created_at, t.updated_at`);
      
      const { rows: [teacher] } = await pool.query(query);
      return teacher;
    } catch (error) {
      logError('Error in getTeacherByIdentifier:', error instanceof Error ? error.message : String(error));
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
        subjectIds: SubjectsSchema,
        employeeId: z.string(),
        joinDate: z.string()
      });

      TeacherSchema.parse(data);

      // Verify all subjects exist
      const subjectQuery = SQL`
        SELECT COUNT(*) as count 
        FROM subjects 
        WHERE id = ANY(${data.subjectIds}::uuid[])
      `;
      const { rows: [{ count }] } = await client.query(subjectQuery);
      
      if (parseInt(count) !== data.subjectIds.length) {
        throw new Error('One or more subject IDs are invalid');
      }

      const query = SQL`
        INSERT INTO teachers (
          name, email, phone, subjects, employee_id, join_date, status
        ) VALUES (
          ${data.name}, ${data.email}, ${data.phone}, ${data.subjectIds}::uuid[], 
          ${data.employeeId}, ${data.joinDate}, 'active'
        )
        RETURNING id
      `;

      const { rows: [teacher] } = await client.query(query);
      await client.query('COMMIT');

      logInfo(`Created teacher: ${teacher.id}`);
      return await this.getTeacherByIdentifier({ id: teacher.id });
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error in createTeacher:', error instanceof Error ? error.message : String(error));
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
        subjectIds: SubjectsSchema.optional(),
        employeeId: z.string().optional(),
        joinDate: z.string().optional(),
        status: StatusSchema.optional()
      });

      UpdateTeacherSchema.parse(data);

      // If updating subjects, verify they exist
      if (data.subjectIds) {
        const subjectQuery = SQL`
          SELECT COUNT(*) as count 
          FROM subjects 
          WHERE id = ANY(${data.subjectIds}::uuid[])
        `;
        const { rows: [{ count }] } = await client.query(subjectQuery);
        
        if (parseInt(count) !== data.subjectIds.length) {
          throw new Error('One or more subject IDs are invalid');
        }
      }

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
      if (data.subjectIds !== undefined) {
        queryParts.push('subjects = ');
        setValues.push(SQL`${data.subjectIds}::uuid[]`);
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
        RETURNING id
      `;

      const { rows: [teacher] } = await client.query(query);
      await client.query('COMMIT');

      logInfo(`Updated teacher: ${id}`);
      return await this.getTeacherByIdentifier({ id: teacher.id });
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error in updateTeacher:', error instanceof Error ? error.message : String(error));
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
        RETURNING id
      `;
      
      const { rows: [teacher] } = await pool.query(query);
      
      if (teacher) {
        logInfo(`Deleted teacher: ${id}`);
      }
      return teacher;
    } catch (error) {
      logError('Error in deleteTeacher:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
