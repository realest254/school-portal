import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const UUIDSchema = z.string().uuid();
const StatusSchema = z.enum(['active', 'resolved', 'deleted']);
const SeveritySchema = z.enum(['minor', 'moderate', 'severe']);

interface Indiscipline {
  id: string;
  student_id: string;
  reported_by: string;
  incident_date: Date;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'deleted';
  action_taken?: string;
  created_at: Date;
  updated_at: Date;
}

interface IndisciplineFilters {
  student_id?: string;
  severity?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export class IndisciplineService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  private validateFilters(filters: IndisciplineFilters) {
    if (filters.severity) {
      SeveritySchema.parse(filters.severity);
    }
    if (filters.status) {
      StatusSchema.parse(filters.status);
    }
    if (filters.student_id) {
      UUIDSchema.parse(filters.student_id);
    }
    if (filters.startDate) {
      z.date().parse(filters.startDate);
    }
    if (filters.endDate) {
      z.date().parse(filters.endDate);
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
    status?: 'active' | 'resolved' | 'deleted';
    action_taken?: string;
  }) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
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

      const { rows: [result] } = await client.query(query, values);
      
      if (!result) {
        throw new Error('Indiscipline record not found');
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

  async delete(id: string) {
    const query = SQL`
      UPDATE indiscipline
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND status != 'deleted'
      RETURNING *;
    `;

    const result = await this.db.query(query);
    return result.rows[0];
  }

  async getById(id: string) {
    const query = SQL`
      SELECT *
      FROM indiscipline
      WHERE id = ${id} AND status != 'deleted';
    `;

    const result = await this.db.query(query);
    return result.rows[0];
  }

  async getAll(filters: IndisciplineFilters = {}) {
    try {
      const query = SQL`
        SELECT i.*, 
               s.name as student_name, 
               s.admission_number,
               t.name as reporter_name
        FROM indiscipline i
        JOIN students s ON i.student_id = s.id
        JOIN teachers t ON i.reported_by = t.id
        WHERE 1=1
      `;

      if (filters.student_id) {
        query.append(SQL` AND i.student_id = ${filters.student_id}`);
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

      query.append(SQL` ORDER BY i.created_at DESC`);

      const { rows } = await this.db.query(query);
      return rows;
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
