import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const UUIDSchema = z.string().uuid();
const StatusSchema = z.enum(['active', 'resolved']);
const SeveritySchema = z.enum(['minor', 'moderate', 'severe']);

const CreateIndisciplineSchema = z.object({
  studentAdmissionNumber: z.string().min(1),
  reporterEmail: z.string().email(),
  incident_date: z.date(),
  description: z.string().min(1),
  severity: SeveritySchema,
  action_taken: z.string().optional()
});

const UpdateIndisciplineSchema = z.object({
  studentAdmissionNumber: z.string().min(1).optional(),
  reporterEmail: z.string().email().optional(),
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
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  studentAdmissionNumber: z.string().optional()
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

interface Indiscipline {
  id: string;
  student_id: string;
  reported_by: string;
  incident_date: Date;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  status: 'active' | 'resolved';
  action_taken?: string;
  created_at: Date;
  updated_at: Date;
}

interface IndisciplineFilters {
  severity?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  studentAdmissionNumber?: string;
}

export class IndisciplineService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  private validateFilters(filters: IndisciplineFilters) {
    if (!filters) return;
    
    const validationResult = FilterSchema.safeParse(filters);
    if (!validationResult.success) {
      throw new Error(`Invalid filters: ${validationResult.error.message}`);
    }
  }

  private async resolveStudentId(admissionNumber: string): Promise<string> {
    const query = SQL`
      SELECT id 
      FROM students 
      WHERE admission_number = ${admissionNumber}
      AND status = 'active'
    `;
    
    const { rows } = await this.db.query(query);
    if (rows.length === 0) {
      throw new Error(`Student with admission number ${admissionNumber} not found`);
    }
    return rows[0].id;
  }

  private async resolveTeacherId(teacherEmail: string): Promise<string> {
    const query = SQL`
      SELECT id 
      FROM teachers 
      WHERE email = ${teacherEmail}
      AND status = 'active'
    `;
    
    const { rows } = await this.db.query(query);
    if (rows.length === 0) {
      throw new Error(`Teacher with email ${teacherEmail} not found`);
    }
    return rows[0].id;
  }

  async create(data: { 
    studentAdmissionNumber: string;
    reporterEmail: string;
    incident_date: Date;
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    action_taken?: string;
  }) {
    // Validate input data
    const validationResult = CreateIndisciplineSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Resolve IDs from provided identifiers
      const student_id = await this.resolveStudentId(data.studentAdmissionNumber);
      const reported_by = await this.resolveTeacherId(data.reporterEmail);

      const query = SQL`
        INSERT INTO indiscipline (
          student_id, reported_by, incident_date, description, 
          severity, status, action_taken
        ) VALUES (
          ${student_id}, ${reported_by}, ${data.incident_date}, 
          ${data.description}, ${data.severity}, 'active', ${data.action_taken}
        )
        RETURNING *
      `;

      const { rows: [result] } = await client.query(query);
      await client.query('COMMIT');
      return result;
    } catch (error: any) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Failed to create indiscipline record';
      throw new Error(`Failed to create indiscipline record: ${message}`);
    } finally {
      client.release();
    }
  }

  async update(id: string, data: {
    studentAdmissionNumber?: string;
    reporterEmail?: string;
    incident_date?: Date;
    description?: string;
    severity?: 'minor' | 'moderate' | 'severe';
    status?: 'active' | 'resolved';
    action_taken?: string;
  }) {
    // Validate update data
    const validationResult = UpdateIndisciplineSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // First check if record exists
      const checkQuery = SQL`
        SELECT id FROM indiscipline WHERE id = ${id}
      `;
      
      const { rows: [existingRecord] } = await client.query(checkQuery);
      if (!existingRecord) {
        throw new Error('Indiscipline record not found');
      }
      
      const setClause = [];
      const values = [id];
      let paramCount = 2;

      if (data.studentAdmissionNumber) {
        const student_id = await this.resolveStudentId(data.studentAdmissionNumber);
        setClause.push(`student_id = $${paramCount++}`);
        values.push(student_id);
      }

      if (data.reporterEmail) {
        const reported_by = await this.resolveTeacherId(data.reporterEmail);
        setClause.push(`reported_by = $${paramCount++}`);
        values.push(reported_by);
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

      const { rows: [result] } = await client.query(query, [...values.slice(1), id]);
      
      if (!result) {
        throw new Error('Failed to update record');
      }

      await client.query('COMMIT');
      return result;
    } catch (error: any) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Failed to update indiscipline record';
      throw new Error(`Failed to update indiscipline record: ${message}`);
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // First check if the record exists
      const checkQuery = SQL`
        SELECT id 
        FROM indiscipline 
        WHERE id = ${id}
      `;
      
      const { rows: [existingRecord] } = await client.query(checkQuery);
      
      if (!existingRecord) {
        throw new Error('Indiscipline record not found');
      }

      const deleteQuery = SQL`
        DELETE FROM indiscipline
        WHERE id = ${id}
      `;

      const result = await this.db.query(deleteQuery);
      
      if (result.rowCount === 0) {
        throw new Error('Failed to delete record');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to delete indiscipline record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  async getById(id: string) {
    const query = SQL`
      SELECT *
      FROM indiscipline
      WHERE id = ${id}
    `;

    const result = await this.db.query(query);
    return result.rows[0] || null;
  }

  async getAll(filters: IndisciplineFilters = {}) {
    this.validateFilters(filters);
    try {
      const query = SQL`
        SELECT i.*, 
               s.admission_number as student_admission_number,
               t.email as reporter_email
        FROM indiscipline i
        JOIN students s ON i.student_id = s.id
        JOIN teachers t ON i.reported_by = t.id
        WHERE 1=1
      `;

      if (filters.studentAdmissionNumber) {
        query.append(SQL` AND s.admission_number = ${filters.studentAdmissionNumber}`);
      }

      if (filters.severity) {
        query.append(SQL` AND i.severity = ${filters.severity}`);
      }

      if (filters.status) {
        query.append(SQL` AND i.status = ${filters.status}`);
      }

      if (filters.startDate) {
        query.append(SQL` AND i.incident_date >= ${filters.startDate}`);
      }

      if (filters.endDate) {
        query.append(SQL` AND i.incident_date <= ${filters.endDate}`);
      }

      query.append(SQL` ORDER BY i.incident_date DESC`);

      const { rows } = await this.db.query(query);
      return rows.map(row => ({
        id: row.id,
        studentAdmissionNumber: row.student_admission_number,
        reporterEmail: row.reporter_email,
        incident_date: row.incident_date,
        description: row.description,
        severity: row.severity,
        status: row.status,
        action_taken: row.action_taken,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get indiscipline records';
      throw new Error(`Failed to get indiscipline records: ${message}`);
    }
  }

  async getByStudentId(studentId: string) {
    const query = SQL`
      SELECT i.*, 
             t.name as reporter_name
      FROM indiscipline i
      JOIN teachers t ON i.reported_by = t.id
      WHERE i.student_id = ${studentId}
      ORDER BY i.incident_date DESC
    `;

    const { rows } = await this.db.query(query);
    return rows;
  }
}
