import { Pool } from 'pg';
import { UserRole } from '../middlewares/auth.middleware';
import pool from '../db';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import CacheService from '../cache/cache.service';

// Validation schemas
const UUIDSchema = z.string().uuid();
const StatusSchema = z.enum(['active', 'expired', 'deleted']);
const PrioritySchema = z.enum(['low', 'medium', 'high']);
const TargetAudienceSchema = z.enum(['admin', 'teacher', 'student']);

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

class NotificationError extends Error {
  code: string;
  status: number;
  errors: any;

  constructor(message: string, code: string, status: number, errors: any) {
    super(message);
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

enum NotificationErrorCodes {
  VALIDATION_ERROR = { code: 'VALIDATION_ERROR', status: 400 },
  DATABASE_ERROR = { code: 'DATABASE_ERROR', status: 500 },
  NOT_FOUND = { code: 'NOT_FOUND', status: 404 },
}

export class NotificationService {
  private db: Pool;
  private cache: CacheService;

  constructor() {
    this.db = pool;
    this.cache = new CacheService();
  }

  private validateFilters(filters: NotificationFilters) {
    if (filters.priority) {
      PrioritySchema.parse(filters.priority);
    }
    if (filters.status) {
      StatusSchema.parse(filters.status);
    }
    if (filters.target_audience) {
      TargetAudienceSchema.parse(filters.target_audience);
    }
    if (filters.startDate) {
      z.date().parse(filters.startDate);
    }
    if (filters.endDate) {
      z.date().parse(filters.endDate);
    }
  }

  private validateInputs(data: any, schema: z.ZodSchema) {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new NotificationError(
          'Validation failed',
          NotificationErrorCodes.VALIDATION_ERROR.code,
          NotificationErrorCodes.VALIDATION_ERROR.status,
          error.errors
        );
      }
      throw error;
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
      // Try to get from cache first
      const cached = await this.cache.get<Notification>('single', id);
      if (cached) {
        return cached;
      }

      // Validate UUID
      UUIDSchema.parse(id);

      const query = SQL`
        SELECT * FROM notifications 
        WHERE id = ${id} AND status != 'deleted'
      `;
      
      const { rows: [notification] } = await this.db.query(query);
      
      if (notification) {
        // Cache the result
        await this.cache.set('single', id, notification);
      }
      
      return notification || null;
    } catch (error) {
      throw new NotificationError(
        'Failed to fetch notification',
        NotificationErrorCodes.DATABASE_ERROR.code,
        NotificationErrorCodes.DATABASE_ERROR.status,
        error
      );
    }
  }

  async getForRecipient(
    userId: string,
    role: UserRole,
    page: number,
    limit: number
  ): Promise<{ notifications: Notification[]; total: number }> {
    const cacheKey = `${userId}:${role}:${page}:${limit}`;
    try {
      // Try to get from cache first
      const cached = await this.cache.get<{ notifications: Notification[]; total: number }>('user', cacheKey);
      if (cached) {
        return cached;
      }

      // Validate inputs
      UUIDSchema.parse(userId);
      z.enum(['admin', 'teacher', 'student']).parse(role);
      z.number().positive().parse(page);
      z.number().positive().max(100).parse(limit);

      const offset = (page - 1) * limit;

      const query = SQL`
        SELECT n.*, COUNT(*) OVER() as total
        FROM notifications n
        WHERE n.status = 'active'
        AND n.expires_at > NOW()
        AND ${role} = ANY(n.target_audience)
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const { rows } = await this.db.query(query);
      const result = {
        notifications: rows.map(row => ({ ...row, total: undefined })),
        total: rows.length > 0 ? Number(rows[0].total) : 0
      };

      // Cache the result
      await this.cache.set('user', cacheKey, result);
      
      return result;
    } catch (error) {
      throw new NotificationError(
        'Failed to fetch notifications',
        NotificationErrorCodes.DATABASE_ERROR.code,
        NotificationErrorCodes.DATABASE_ERROR.status,
        error
      );
    }
  }

  async create(data: any): Promise<Notification> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      // Validate input data
      const CreateNotificationSchema = z.object({
        title: z.string().min(1, "Title cannot be empty"),
        message: z.string().min(1, "Message cannot be empty"),
        priority: PrioritySchema,
        target_audience: z.array(z.enum(['admin', 'teacher', 'student'])).min(1, "Target audience cannot be empty"),
        expires_at: z.date().optional()
      });

      this.validateInputs(data, CreateNotificationSchema);

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

      // Invalidate relevant caches
      await this.cache.invalidatePattern('user');
      
      return notification;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotificationError) {
        throw error;
      }
      throw new NotificationError(
        'Failed to create notification',
        NotificationErrorCodes.DATABASE_ERROR.code,
        NotificationErrorCodes.DATABASE_ERROR.status,
        error
      );
    } finally {
      client.release();
    }
  }

  async update(id: string, data: any): Promise<Notification> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const notification = await this.getById(id);
      if (!notification) {
        throw new NotificationError(
          'Notification not found',
          NotificationErrorCodes.NOT_FOUND.code,
          NotificationErrorCodes.NOT_FOUND.status
        );
      }

      // Validate status transition
      if (data.status && data.status !== notification.status) {
        if (notification.status === 'expired' && data.status === 'active') {
          throw new Error('Cannot reactivate expired notification');
        }
      }

      const updateQuery = SQL`
        UPDATE notifications SET
          title = COALESCE(${data.title}, title),
          message = COALESCE(${data.message}, message),
          priority = COALESCE(${data.priority}, priority),
          target_audience = COALESCE(${data.target_audience}, target_audience),
          status = COALESCE(${data.status}, status),
          expires_at = COALESCE(${data.expires_at}, expires_at),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *`;

      const { rows: [notification] } = await client.query(updateQuery);
      await client.query('COMMIT');

      // Invalidate caches
      await this.cache.invalidate('single', id);
      await this.cache.invalidatePattern('user');

      return notification;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const notification = await this.getById(id);
      if (!notification) {
        throw new NotificationError(
          'Notification not found',
          NotificationErrorCodes.NOT_FOUND.code,
          NotificationErrorCodes.NOT_FOUND.status
        );
      }

      const query = SQL`
        UPDATE notifications 
        SET status = 'deleted' 
        WHERE id = ${id}
      `;
      
      await client.query(query);
      await client.query('COMMIT');

      // Invalidate caches
      await this.cache.invalidate('single', id);
      await this.cache.invalidatePattern('user');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
