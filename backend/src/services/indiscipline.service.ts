import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import { ServiceResult, ServiceError } from '../types/common.types';

// Validation schemas
const UUIDSchema = z.string().uuid();
const StatusSchema = z.enum(['active', 'resolved']);
const SeveritySchema = z.enum(['minor', 'moderate', 'severe']);

const CreateIndisciplineSchema = z.object({
  studentId: z.string().min(1),
  createdBy: z.string().email(),
  incident_date: z.date(),
  description: z.string().min(1),
  severity: SeveritySchema,
  action_taken: z.string().optional()
});

const UpdateIndisciplineSchema = z.object({
  studentId: z.string().min(1).optional(),
  createdBy: z.string().email().optional(),
  incident_date: z.date().optional(),
  description: z.string().min(1).optional(),
  severity: SeveritySchema.optional(),
  status: StatusSchema.optional(),
  action_taken: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

const FilterSchema = z.object({
  severity: SeveritySchema.optional(),
  status: StatusSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  studentId: z.string().optional(),
  teacherEmail: z.string().optional(),
  forStudent: z.string().optional()
}).refine(
  data => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

export interface IndisciplineRecord {
  id: string;
  studentId: string;
  createdBy: string;
  incident_date: Date;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  status: 'active' | 'resolved';
  action_taken?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IndisciplineFilters {
  severity?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  studentId?: string;
  teacherEmail?: string;
  forStudent?: string;
}

class IndisciplineService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  private validateFilters(filters: IndisciplineFilters): ServiceResult<void> {
    try {
      const validationResult = FilterSchema.safeParse(filters);
      if (!validationResult.success) {
        return {
          success: false,
          data: null,
          error: validationResult.error.message
        };
      }
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: 'Invalid filters provided'
      };
    }
  }

  async create(data: {
    studentId: string;
    createdBy: string;
    incident_date: Date;
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    action_taken?: string;
  }): Promise<ServiceResult<IndisciplineRecord>> {
    const client = await this.db.connect();
    try {
      const validationResult = CreateIndisciplineSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          data: null,
          error: validationResult.error.message
        };
      }

      await client.query('BEGIN');

      const query = SQL`
        INSERT INTO indiscipline (
          student_id, reported_by, incident_date, description, 
          severity, status, action_taken
        ) VALUES (
          ${data.studentId}, ${data.createdBy}, ${data.incident_date.toISOString()}, 
          ${data.description}, ${data.severity}, 'active', ${data.action_taken}
        )
        RETURNING *
      `;

      const { rows: [result] } = await client.query(query);
      await client.query('COMMIT');

      return {
        success: true,
        data: this.mapToIndisciplineRecord(result)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        data: null,
        error: 'Failed to create indiscipline record'
      };
    } finally {
      client.release();
    }
  }

  async update(id: string, data: Partial<IndisciplineRecord>): Promise<ServiceResult<IndisciplineRecord>> {
    const client = await this.db.connect();
    try {
      const validationResult = UpdateIndisciplineSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          data: null,
          error: validationResult.error.message
        };
      }

      await client.query('BEGIN');

      const existingRecord = await this.getById(id);
      if (!existingRecord.success || !existingRecord.data) {
        return {
          success: false,
          data: null,
          error: 'Indiscipline record not found'
        };
      }

      const setClause = [];
      const values = [id];
      let paramCount = 2;

      if (data.studentId) {
        setClause.push(`student_id = $${paramCount++}`);
        values.push(data.studentId);
      }

      if (data.createdBy) {
        setClause.push(`reported_by = $${paramCount++}`);
        values.push(data.createdBy);
      }

      if (data.incident_date) {
        setClause.push(`incident_date = $${paramCount++}`);
        values.push(data.incident_date.toISOString());
      }

      if (data.description) {
        setClause.push(`description = $${paramCount++}`);
        values.push(data.description);
      }

      if (data.severity) {
        setClause.push(`severity = $${paramCount++}`);
        values.push(data.severity);
      }

      if (data.status) {
        setClause.push(`status = $${paramCount++}`);
        values.push(data.status);
      }

      if (data.action_taken !== undefined) {
        setClause.push(`action_taken = $${paramCount++}`);
        values.push(data.action_taken);
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE indiscipline
        SET ${setClause.join(', ')}
        WHERE id = $1
        RETURNING *
      `;

      const { rows: [result] } = await client.query(query, values);
      
      if (!result) {
        return {
          success: false,
          data: null,
          error: 'Failed to update record'
        };
      }

      await client.query('COMMIT');
      return {
        success: true,
        data: this.mapToIndisciplineRecord(result)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        data: null,
        error: 'Failed to update indiscipline record'
      };
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const existingRecord = await this.getById(id);
      if (!existingRecord.success || !existingRecord.data) {
        return {
          success: false,
          data: null,
          error: 'Indiscipline record not found'
        };
      }

      const deleteQuery = SQL`
        DELETE FROM indiscipline
        WHERE id = ${id}
      `;

      const result = await this.db.query(deleteQuery);
      
      if (result.rowCount === 0) {
        return {
          success: false,
          data: null,
          error: 'Failed to delete record'
        };
      }

      await client.query('COMMIT');
      return { success: true, data: null };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        data: null,
        error: 'Failed to delete indiscipline record'
      };
    } finally {
      client.release();
    }
  }

  async getById(id: string): Promise<ServiceResult<IndisciplineRecord>> {
    try {
      const query = SQL`
        SELECT i.*, 
               s.admission_number as student_admission_number,
               t.email as reporter_email
        FROM indiscipline i
        JOIN students s ON i.student_id = s.id
        JOIN teachers t ON i.reported_by = t.id
        WHERE i.id = ${id}
      `;

      const { rows: [result] } = await this.db.query(query);
      
      if (!result) {
        return {
          success: false,
          data: null,
          error: 'Indiscipline record not found'
        };
      }

      return {
        success: true,
        data: this.mapToIndisciplineRecord(result)
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: 'Failed to get indiscipline record'
      };
    }
  }

  async getAll(filters: IndisciplineFilters = {}): Promise<ServiceResult<IndisciplineRecord[]>> {
    try {
      const filterValidation = this.validateFilters(filters);
      if (!filterValidation.success) {
        return filterValidation as ServiceResult<IndisciplineRecord[]>;
      }

      const query = SQL`
        SELECT i.*, 
               s.admission_number as student_admission_number,
               t.email as reporter_email
        FROM indiscipline i
        JOIN students s ON i.student_id = s.id
        JOIN teachers t ON i.reported_by = t.id
        WHERE 1=1
      `;

      if (filters.studentId) {
        query.append(SQL` AND i.student_id = ${filters.studentId}`);
      }

      if (filters.teacherEmail) {
        query.append(SQL` AND t.email = ${filters.teacherEmail}`);
      }

      if (filters.forStudent) {
        query.append(SQL` AND s.id = ${filters.forStudent}`);
      }

      if (filters.severity) {
        query.append(SQL` AND i.severity = ${filters.severity}`);
      }

      if (filters.status) {
        query.append(SQL` AND i.status = ${filters.status}`);
      }

      if (filters.startDate) {
        query.append(SQL` AND i.incident_date >= ${filters.startDate.toISOString()}`);
      }

      if (filters.endDate) {
        query.append(SQL` AND i.incident_date <= ${filters.endDate.toISOString()}`);
      }

      query.append(SQL` ORDER BY i.incident_date DESC`);

      const { rows } = await this.db.query(query);
      return {
        success: true,
        data: rows.map(row => this.mapToIndisciplineRecord(row))
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: 'Failed to get indiscipline records'
      };
    }
  }

  async getByStudentId(studentId: string): Promise<ServiceResult<IndisciplineRecord[]>> {
    try {
      const query = SQL`
        SELECT i.*, 
               t.email as reporter_email
        FROM indiscipline i
        JOIN teachers t ON i.reported_by = t.id
        WHERE i.student_id = ${studentId}
        ORDER BY i.incident_date DESC
      `;

      const { rows } = await this.db.query(query);
      return {
        success: true,
        data: rows.map(row => this.mapToIndisciplineRecord(row))
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: 'Failed to get student indiscipline records'
      };
    }
  }

  private mapToIndisciplineRecord(row: any): IndisciplineRecord {
    return {
      id: row.id,
      studentId: row.student_id,
      createdBy: row.reporter_email || row.reported_by,
      incident_date: row.incident_date,
      description: row.description,
      severity: row.severity,
      status: row.status,
      action_taken: row.action_taken,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export const indisciplineService = new IndisciplineService();
