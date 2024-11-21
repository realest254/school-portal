import { Pool } from 'pg';
import SQL from 'sql-template-strings';
import pool from '../db';
import { CreateInviteSchema, InviteSchema } from '../models/invite.model';
import { emailService } from './email.service';

export class InviteService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  async validateEmailDomain(email: string, role: string): Promise<{ valid: boolean; message?: string }> {
    try {
      CreateInviteSchema.parse({ email, role });

      if (role === 'teacher' || role === 'admin') {
        const domain = email.split('@')[1];
        const allowedDomains = ['school.edu', 'district.edu'];
        if (!allowedDomains.includes(domain)) {
          return {
            valid: false,
            message: `Teachers and admins must use an email from: ${allowedDomains.join(', ')}`
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Invalid email or role'
      };
    }
  }

  async checkInviteSpam(email: string): Promise<{ isSpam: boolean; message?: string }> {
    const client = await this.db.connect();
    try {
      const result = await client.query(SQL`
        SELECT COUNT(*) 
        FROM invites 
        WHERE email = ${email} 
        AND created_at > NOW() - INTERVAL '24 hours'
      `);
      
      const count = parseInt(result.rows[0].count);
      if (count >= 3) {
        return {
          isSpam: true,
          message: 'Too many invite attempts. Please try again later.'
        };
      }
      
      return { isSpam: false };
    } finally {
      client.release();
    }
  }

  async createInvite(data: { email: string; role: string; invited_by: string }): Promise<any> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      const expiration_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const result = await client.query(SQL`
        INSERT INTO invites (
          email, role, status, invited_by, expiration_date
        ) VALUES (
          ${data.email}, ${data.role}, 'pending', ${data.invited_by}, ${expiration_date}
        ) RETURNING *
      `);
      
      // Send invite email using Supabase
      await emailService.sendInviteEmail(
        data.email,
        data.role,
        result.rows[0].id,
        process.env.FRONTEND_URL || 'http://localhost:3000'
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async resendInvite(email: string, invited_by: string): Promise<any> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(SQL`
        UPDATE invites 
        SET status = 'expired' 
        WHERE email = ${email} 
        AND status = 'pending'
      `);
      
      const expiration_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const result = await client.query(SQL`
        INSERT INTO invites (
          email, role, status, invited_by, expiration_date
        )
        SELECT 
          email, role, 'pending', ${invited_by}, ${expiration_date}
        FROM invites 
        WHERE email = ${email} 
        ORDER BY created_at DESC 
        LIMIT 1
        RETURNING *
      `);

      // Resend invite email using Supabase
      await emailService.sendInviteEmail(
        email,
        result.rows[0].role,
        result.rows[0].id,
        process.env.FRONTEND_URL || 'http://localhost:3000'
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getInviteHistory(email: string): Promise<any[]> {
    const result = await this.db.query(SQL`
      SELECT * FROM invites 
      WHERE email = ${email} 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async checkInviteValidity(id: string): Promise<{ valid: boolean; message?: string }> {
    const result = await this.db.query(SQL`
      SELECT * FROM invites 
      WHERE id = ${id} 
      AND status = 'pending' 
      AND expiration_date > NOW()
    `);
    
    if (result.rows.length === 0) {
      return {
        valid: false,
        message: 'Invite is invalid or has expired'
      };
    }
    
    return { valid: true };
  }

  async markInviteAsUsed(id: string): Promise<void> {
    await this.db.query(SQL`
      UPDATE invites 
      SET status = 'accepted', 
          accepted_at = NOW() 
      WHERE id = ${id}
    `);
  }

  async getAll(page: number, limit: number, filters: { role?: string; status?: string; email?: string } = {}): Promise<{ invites: any[]; total: number }> {
    try {
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

      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) AS count`;
      const { rows: [{ count }] } = await this.db.query(countQuery);

      query.append(SQL` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
      const { rows: invites } = await this.db.query(query);

      return {
        invites,
        total: parseInt(count)
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get invites');
    }
  }

  async getById(id: string): Promise<any> {
    try {
      const query = SQL`
        SELECT * FROM invites 
        WHERE id = ${id}
      `;
      
      const { rows: [invite] } = await this.db.query(query);
      return invite || null;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get invite');
    }
  }

  async acceptInvite(id: string, userId: string): Promise<any> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const inviteQuery = SQL`
        SELECT * FROM invites 
        WHERE id = ${id}
        AND status = 'pending' 
        AND expiration_date > NOW()
      `;

      const { rows: [invite] } = await client.query(inviteQuery);
      if (!invite) {
        throw new Error('Invalid or expired invite');
      }

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
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(error instanceof Error ? error.message : 'Failed to accept invite');
    } finally {
      client.release();
    }
  }

  async cancelInvite(id: string): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const query = SQL`
        UPDATE invites 
        SET status = 'expired' 
        WHERE id = ${id}
        AND status = 'pending'
      `;

      await client.query(query);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel invite');
    } finally {
      client.release();
    }
  }
}
