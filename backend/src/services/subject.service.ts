import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const SubjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export class SubjectService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  async create(data: { name: string; description?: string }) {
    try {
      // Validate input
      SubjectSchema.parse(data);

      const query = SQL`
        INSERT INTO subjects (name, description)
        VALUES (${data.name}, ${data.description})
        RETURNING *
      `;

      const { rows: [subject] } = await this.db.query(query);
      return subject;
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Subject with name ${data.name} already exists`);
      }
      const message = error instanceof Error ? error.message : 'Failed to create subject';
      throw new Error(`Failed to create subject: ${message}`);
    }
  }

  async update(id: string, data: { name?: string; description?: string }) {
    try {
      // Validate input
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }

      const setClause = [];
      const values = [id];
      let paramCount = 2;

      if (data.name) {
        setClause.push(`name = $${paramCount++}`);
        values.push(data.name);
      }

      if (data.description !== undefined) {
        setClause.push(`description = $${paramCount++}`);
        values.push(data.description);
      }

      const query = `
        UPDATE subjects
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const { rows: [subject] } = await this.db.query(query, values);
      
      if (!subject) {
        throw new Error('Subject not found');
      }

      return subject;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error(`Subject with name ${data.name} already exists`);
      }
      const message = error instanceof Error ? error.message : 'Failed to update subject';
      throw new Error(`Failed to update subject: ${message}`);
    }
  }

  async delete(id: string) {
    try {
      // First check if subject is being used by any teachers
      const checkQuery = SQL`
        SELECT EXISTS (
          SELECT 1 FROM teachers WHERE $1 = ANY(subjects)
        )
      `;
      
      const { rows: [{ exists }] } = await this.db.query(checkQuery, [id]);
      
      if (exists) {
        throw new Error('Cannot delete subject that is assigned to teachers');
      }

      const query = SQL`
        DELETE FROM subjects
        WHERE id = ${id}
        RETURNING *
      `;

      const { rows: [subject] } = await this.db.query(query);
      
      if (!subject) {
        throw new Error('Subject not found');
      }

      return subject;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to delete subject';
      throw new Error(`Failed to delete subject: ${message}`);
    }
  }

  async getById(id: string) {
    try {
      const query = SQL`
        SELECT * FROM subjects
        WHERE id = ${id}
      `;

      const { rows: [subject] } = await this.db.query(query);
      return subject || null;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get subject';
      throw new Error(`Failed to get subject: ${message}`);
    }
  }

  async getAll() {
    try {
      const query = SQL`
        SELECT * FROM subjects
        ORDER BY name ASC
      `;

      const { rows } = await this.db.query(query);
      return rows;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get subjects';
      throw new Error(`Failed to get subjects: ${message}`);
    }
  }

  async search(term: string) {
    try {
      const query = SQL`
        SELECT * FROM subjects
        WHERE name ILIKE ${`%${term}%`}
        ORDER BY name ASC
      `;

      const { rows } = await this.db.query(query);
      return rows;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to search subjects';
      throw new Error(`Failed to search subjects: ${message}`);
    }
  }
}
