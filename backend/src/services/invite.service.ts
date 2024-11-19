import { Pool } from 'pg';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import pool from '../db';
import { UserRole } from '../middlewares/auth.middleware';

// Validation schemas
const UUIDSchema = z.string().uuid();
const EmailSchema = z.string().email();
const RoleSchema = z.enum(['admin', 'teacher', 'student']);
const StatusSchema = z.enum(['pending', 'accepted', 'expired']);

interface InviteFilters {
  role?: UserRole;
  status?: string;
  email?: string;
}

export class InviteService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  private validateFilters(filters: InviteFilters) {
    if (filters.role) {
      RoleSchema.parse(filters.role);
    }
    if (filters.status) {
      StatusSchema.parse(filters.status);
    }
    if (filters.email) {
      EmailSchema.parse(filters.email);
    }
  }

  async getAll(page: number, limit: number, filters: InviteFilters = {}): Promise<{ invites: any[]; total: number }> {
    try {
      // Validate inputs
      z.number().positive().parse(page);
      z.number().positive().max(100).parse(limit);
      this.validateFilters(filters);

      const offset = (page - 1) * limit;
      const query = SQL`SELECT * FROM invites WHERE 1=1`;

      if (filters.role) {
        query.append(SQL` AND role = ${filters.role}`);
      }

      if (filters.status) {
        query.append(SQL` AND status = ${filters.status}`);
      }

      if (filters.email) {
        query.append(SQL` AND email = ${filters.email}`);
      }

      // Get total count
      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) AS count`;
      const { rows: [{ count }] } = await this.db.query(countQuery);

      // Add pagination
      query.append(SQL` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
      const { rows: invites } = await this.db.query(query);

      return {
        invites,
        total: parseInt(count)
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get invites';
      throw new Error(`Failed to get invites: ${message}`);
    }
  }

  async getById(id: string): Promise<any> {
    try {
      // Validate UUID
      UUIDSchema.parse(id);

      const query = SQL`
        SELECT * FROM invites 
        WHERE id = ${id}
      `;
      
      const { rows: [invite] } = await this.db.query(query);
      return invite || null;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get invite';
      throw new Error(`Failed to get invite: ${message}`);
    }
  }

  async createInvite(data: any): Promise<any> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Validate input data
      const InviteSchema = z.object({
        email: EmailSchema,
        role: RoleSchema,
        expiration_date: z.date().optional(),
        invited_by: UUIDSchema
      });

      InviteSchema.parse(data);

      // Check if active invite exists
      const existingInviteQuery = SQL`
        SELECT * FROM invites 
        WHERE email = ${data.email}
        AND status = 'pending' 
        AND (expiration_date IS NULL OR expiration_date > NOW())
      `;

      const { rows: [existingInvite] } = await client.query(existingInviteQuery);
      if (existingInvite) {
        throw new Error('Active invite already exists for this email');
      }

      const query = SQL`
        INSERT INTO invites (
          email, role, expiration_date, invited_by, status
        ) VALUES (
          ${data.email}, ${data.role}, ${data.expiration_date}, 
          ${data.invited_by}, 'pending'
        )
        RETURNING *
      `;

      const { rows: [invite] } = await client.query(query);
      await client.query('COMMIT');
      return invite;
    } catch (error: any) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Failed to create invite';
      throw new Error(`Failed to create invite: ${message}`);
    } finally {
      client.release();
    }
  }

  async acceptInvite(id: string, userId: string): Promise<any> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Validate inputs
      UUIDSchema.parse(id);
      UUIDSchema.parse(userId);

      // Get and validate invite
      const inviteQuery = SQL`
        SELECT * FROM invites 
        WHERE id = ${id}
        AND status = 'pending' 
        AND (expiration_date IS NULL OR expiration_date > NOW())
      `;

      const { rows: [invite] } = await client.query(inviteQuery);
      if (!invite) {
        throw new Error('Invalid or expired invite');
      }

      // Update invite status
      const updateQuery = SQL`
        UPDATE invites 
        SET status = 'accepted',
            accepted_by = ${userId},
            accepted_at = NOW() 
        WHERE id = ${id}
        RETURNING *
      `;

      const { rows: [updatedInvite] } = await client.query(updateQuery);
      await client.query('COMMIT');
      return updatedInvite;
    } catch (error: any) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Failed to accept invite';
      throw new Error(`Failed to accept invite: ${message}`);
    } finally {
      client.release();
    }
  }

  async cancelInvite(id: string): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Validate UUID
      UUIDSchema.parse(id);

      const query = SQL`
        UPDATE invites 
        SET status = 'expired' 
        WHERE id = ${id}
        AND status = 'pending'
      `;

      await client.query(query);
      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Failed to cancel invite';
      throw new Error(`Failed to cancel invite: ${message}`);
    } finally {
      client.release();
    }
  }
}
