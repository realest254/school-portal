import { Database } from 'sqlite3';
import { open } from 'sqlite';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const SubjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export interface Subject {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class SubjectTestService {
  private static instance: SubjectTestService;
  private db: any; // SQLite database instance

  private constructor() {}

  static getInstance(): SubjectTestService {
    if (!SubjectTestService.instance) {
      SubjectTestService.instance = new SubjectTestService();
    }
    return SubjectTestService.instance;
  }

  async initialize() {
    // Open SQLite database in memory
    this.db = await open({
      filename: ':memory:',
      driver: Database
    });

    // Create subjects table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || 
          substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || 
          substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create teacher_subjects table for testing subject deletion constraints
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_subjects (
        teacher_id TEXT,
        subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (teacher_id, subject_id)
      )
    `);
  }

  // Helper method for tests to setup test data
  async __test_insertTeacherSubject(teacherId: string, subjectId: string) {
    await this.db.run(
      'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
      [teacherId, subjectId]
    );
  }

  async create(data: { name: string; description?: string }): Promise<Subject> {
    try {
      // Validate input
      SubjectSchema.parse(data);

      const subject = await this.db.get(
        'INSERT INTO subjects (name, description) VALUES (?, ?) RETURNING *',
        [data.name, data.description]
      );

      return subject;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error(`Subject with name ${data.name} already exists`);
      }
      const message = error instanceof Error ? error.message : 'Failed to create subject';
      throw new Error(`Failed to create subject: ${message}`);
    }
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Subject> {
    try {
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }

      const setClauses = [];
      const values = [];

      if (data.name !== undefined) {
        setClauses.push('name = ?');
        values.push(data.name);
      }

      if (data.description !== undefined) {
        setClauses.push('description = ?');
        values.push(data.description);
      }

      setClauses.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const subject = await this.db.get(
        `UPDATE subjects
         SET ${setClauses.join(', ')}
         WHERE id = ?
         RETURNING *`,
        values
      );
      
      if (!subject) {
        throw new Error('Subject not found');
      }

      return subject;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error(`Subject with name ${data.name} already exists`);
      }
      const message = error instanceof Error ? error.message : 'Failed to update subject';
      throw new Error(`Failed to update subject: ${message}`);
    }
  }

  async delete(id: string): Promise<Subject> {
    try {
      const subject = await this.db.get(
        'DELETE FROM subjects WHERE id = ? RETURNING *',
        [id]
      );
      
      if (!subject) {
        throw new Error('Subject not found');
      }

      return subject;
    } catch (error: any) {
      if (error.message === 'Subject not found') {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Failed to delete subject';
      throw new Error(`Failed to delete subject: ${message}`);
    }
  }

  async getById(id: string): Promise<Subject | null> {
    try {
      const subject = await this.db.get(
        'SELECT * FROM subjects WHERE id = ?',
        [id]
      );
      return subject || null;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get subject';
      throw new Error(`Failed to get subject: ${message}`);
    }
  }

  async getAll(): Promise<Subject[]> {
    try {
      return await this.db.all(
        'SELECT * FROM subjects ORDER BY name ASC'
      );
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get subjects';
      throw new Error(`Failed to get subjects: ${message}`);
    }
  }

  async search(term: string): Promise<Subject[]> {
    try {
      return await this.db.all(
        'SELECT * FROM subjects WHERE name LIKE ? ORDER BY name ASC',
        [`%${term}%`]
      );
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to search subjects';
      throw new Error(`Failed to search subjects: ${message}`);
    }
  }
}
