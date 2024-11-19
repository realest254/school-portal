import { Pool } from 'pg';
import { UserRole } from '../middlewares/auth.middleware';
import pool from '../db';
import SQL from 'sql-template-strings';
import { z } from 'zod';

// Validation schemas
const UUIDSchema = z.string().uuid();
const StatusSchema = z.enum(['active', 'inactive', 'deleted']);
const PrioritySchema = z.enum(['low', 'medium', 'high']);

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  target_audience: UserRole[];
  status: 'active' | 'expired' | 'deleted';
  created_at: Date;
  expires_at?: Date;
}

interface NotificationFilters {
  priority?: string;
  status?: string;
  target_audience?: string;
  startDate?: Date;
  endDate?: Date;
}

export class NotificationService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  private validateFilters(filters: NotificationFilters) {
    if (filters.priority) {
      PrioritySchema.parse(filters.priority);
    }
    if (filters.status) {
      StatusSchema.parse(filters.status);
    }
    if (filters.target_audience) {
      z.string().parse(filters.target_audience);
    }
    if (filters.startDate) {
      z.date().parse(filters.startDate);
    }
    if (filters.endDate) {
      z.date().parse(filters.endDate);
    }
  }

  async getAll(
    page: number,
    limit: number,
    filters: NotificationFilters
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      // Validate inputs
      z.number().positive().parse(page);
      z.number().positive().max(100).parse(limit);
      this.validateFilters(filters);

      const offset = (page - 1) * limit;
      const query = SQL`SELECT * FROM notifications WHERE status != 'deleted'`;

      if (filters.priority) {
        query.append(SQL` AND priority = ${filters.priority}`);
      }

      if (filters.status) {
        query.append(SQL` AND status = ${filters.status}`);
      }

      if (filters.target_audience) {
        query.append(SQL` AND ${filters.target_audience} = ANY(target_audience)`);
      }

      if (filters.startDate) {
        query.append(SQL` AND created_at >= ${filters.startDate}`);
      }

      if (filters.endDate) {
        query.append(SQL` AND created_at <= ${filters.endDate}`);
      }

      // Get total count
      const countQuery = SQL`SELECT COUNT(*) FROM (${query}) AS count`;
      const { rows: [{ count }] } = await this.db.query(countQuery);

      // Add pagination
      query.append(SQL` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
      const { rows: notifications } = await this.db.query(query);

      return {
        notifications,
        total: parseInt(count)
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get notifications';
      throw new Error(`Failed to get notifications: ${message}`);
    }
  }

  async getById(id: string): Promise<Notification | null> {
    try {
      // Validate UUID
      UUIDSchema.parse(id);

      const query = SQL`
        SELECT * FROM notifications
        WHERE id = ${id} AND status != 'deleted'
      `;
      
      const { rows: [notification] } = await this.db.query(query);
      return notification || null;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get notification';
      throw new Error(`Failed to get notification: ${message}`);
    }
  }

  async getForRecipient(
    userId: string,
    role: UserRole,
    page: number,
    limit: number
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      // Validate inputs
      UUIDSchema.parse(userId);
      z.enum(['admin', 'teacher', 'student']).parse(role);
      z.number().positive().parse(page);
      z.number().positive().max(100).parse(limit);

      const offset = (page - 1) * limit;

      const query = SQL`
        SELECT * FROM notifications
        WHERE status = 'active'
        AND ${role} = ANY(target_audience)
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countQuery = SQL`
        SELECT COUNT(*) FROM notifications
        WHERE status = 'active'
        AND ${role} = ANY(target_audience)
        AND (expires_at IS NULL OR expires_at > NOW())
      `;

      const [dataResult, countResult] = await Promise.all([
        this.db.query(query),
        this.db.query(countQuery)
      ]);

      return {
        notifications: dataResult.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to get notifications for recipient';
      throw new Error(`Failed to get notifications for recipient: ${message}`);
    }
  }

  async create(data: any): Promise<Notification> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Validate input data
      const NotificationSchema = z.object({
        title: z.string(),
        message: z.string(),
        priority: PrioritySchema,
        target_audience: z.array(z.string()),
        expires_at: z.date().optional()
      });

      NotificationSchema.parse(data);

      const query = SQL`
        INSERT INTO notifications (
          title, message, priority, target_audience, expires_at, status
        ) VALUES (
          ${data.title}, ${data.message}, ${data.priority}, 
          ${data.target_audience}, ${data.expires_at}, 'active'
        )
        RETURNING *
      `;

      const { rows: [notification] } = await client.query(query);
      await client.query('COMMIT');
      return notification;
    } catch (error: any) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Failed to create notification';
      throw new Error(`Failed to create notification: ${message}`);
    } finally {
      client.release();
    }
  }

  async update(id: string, data: any): Promise<Notification> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Validate inputs
      UUIDSchema.parse(id);
      const UpdateNotificationSchema = z.object({
        title: z.string().optional(),
        message: z.string().optional(),
        priority: PrioritySchema.optional(),
        target_audience: z.array(z.string()).optional(),
        expires_at: z.date().optional(),
        status: StatusSchema.optional()
      });

      UpdateNotificationSchema.parse(data);

      const setValues: ReturnType<typeof SQL>[] = [];
      const queryParts: string[] = [];

      if (data.title !== undefined) {
        queryParts.push('title = ');
        setValues.push(SQL`${data.title}`);
      }
      if (data.message !== undefined) {
        queryParts.push('message = ');
        setValues.push(SQL`${data.message}`);
      }
      if (data.priority !== undefined) {
        queryParts.push('priority = ');
        setValues.push(SQL`${data.priority}`);
      }
      if (data.target_audience !== undefined) {
        queryParts.push('target_audience = ');
        setValues.push(SQL`${data.target_audience}`);
      }
      if (data.expires_at !== undefined) {
        queryParts.push('expires_at = ');
        setValues.push(SQL`${data.expires_at}`);
      }
      if (data.status !== undefined) {
        queryParts.push('status = ');
        setValues.push(SQL`${data.status}`);
      }

      if (setValues.length === 0) {
        throw new Error('No fields to update');
      }

      const setClause = queryParts.map((part, i) => part + setValues[i]).join(', ');
      const query = SQL`
        UPDATE notifications 
        SET ${setClause} 
        WHERE id = ${id}
        RETURNING *
      `;

      const { rows: [notification] } = await client.query(query);
      await client.query('COMMIT');
      return notification;
    } catch (error: any) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Failed to update notification';
      throw new Error(`Failed to update notification: ${message}`);
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Validate UUID
      UUIDSchema.parse(id);

      const query = SQL`
        UPDATE notifications 
        SET status = 'deleted' 
        WHERE id = ${id}
      `;
      await this.db.query(query);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification';
      throw new Error(`Failed to delete notification: ${message}`);
    }
  }
}
