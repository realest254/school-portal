import pool from '../config/database';
import { logError, logInfo } from '../utils/logger';
import SQL from 'sql-template-strings';
import { z } from 'zod';
import { v4 } from 'uuid';
import {
  UUID,
  ServiceError,
  ServiceResult,
  PaginationParams,
  PaginatedResult,
  createUUID,
} from '../types/common.types';
import { UserRole } from '../middlewares/auth.middleware';

// Notification-specific error types
export class NotificationNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`Notification not found: ${identifier}`, 'NOTIFICATION_NOT_FOUND', 404);
  }
}

// Validation schemas
const NotificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).max(200),
  message: z.string().min(1).max(2000),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  targetAudience: z.array(z.enum(['admin', 'teacher', 'student'])),
  status: z.enum(['active', 'expired', 'deleted']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date(),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional()
});

export type Notification = z.infer<typeof NotificationSchema>;

export interface NotificationFilters extends PaginationParams {
  priority?: 'high' | 'medium' | 'low';
  status?: 'active' | 'expired' | 'deleted';
  targetAudience?: UserRole;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  priority?: 'high' | 'medium' | 'low';
  targetAudience: UserRole[];
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface UpdateNotificationData {
  title?: string;
  message?: string;
  priority?: 'high' | 'medium' | 'low';
  targetAudience?: UserRole[];
  status?: 'active' | 'expired' | 'deleted';
  scheduledFor?: Date;
  expiresAt?: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private validateFilters(filters: NotificationFilters): void {
    const { priority, status, targetAudience, startDate, endDate, page, limit } = filters;
    
    if (priority && !['high', 'medium', 'low'].includes(priority)) {
      throw new ServiceError('Invalid priority filter', 'INVALID_FILTER', 400);
    }
    
    if (status && !['active', 'expired', 'deleted'].includes(status)) {
      throw new ServiceError('Invalid status filter', 'INVALID_FILTER', 400);
    }
    
    if (targetAudience && !['admin', 'teacher', 'student'].includes(targetAudience)) {
      throw new ServiceError('Invalid target audience filter', 'INVALID_FILTER', 400);
    }
    
    if (startDate && endDate && startDate > endDate) {
      throw new ServiceError('Start date cannot be after end date', 'INVALID_FILTER', 400);
    }

    if (page) {
      z.number().positive().parse(page);
    }
    
    if (limit) {
      z.number().positive().max(100).parse(limit);
    }
  }

  async getAll(filters: NotificationFilters = {}): Promise<PaginatedResult<Notification[]>> {
    try {
      this.validateFilters(filters);
      
      const { priority, status, targetAudience, startDate, endDate, page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;
      
      const query = SQL`
        SELECT *
        FROM notifications
        WHERE 1=1
      `;
      
      if (priority) {
        query.append(SQL` AND priority = ${priority}`);
      }
      
      if (status) {
        query.append(SQL` AND status = ${status}`);
      }
      
      if (targetAudience) {
        query.append(SQL` AND ${targetAudience} = ANY(target_audience)`);
      }
      
      if (startDate) {
        query.append(SQL` AND created_at >= ${startDate}`);
      }
      
      if (endDate) {
        query.append(SQL` AND created_at <= ${endDate}`);
      }
      
      query.append(SQL` 
        ORDER BY created_at DESC
        LIMIT ${limit} 
        OFFSET ${offset}
      `);
      
      const countQuery = SQL`
        SELECT COUNT(*)
        FROM notifications
        WHERE 1=1
      `;
      
      // Add the same filters to count query
      if (priority) countQuery.append(SQL` AND priority = ${priority}`);
      if (status) countQuery.append(SQL` AND status = ${status}`);
      if (targetAudience) countQuery.append(SQL` AND ${targetAudience} = ANY(target_audience)`);
      if (startDate) countQuery.append(SQL` AND created_at >= ${startDate}`);
      if (endDate) countQuery.append(SQL` AND created_at <= ${endDate}`);
      
      const [{ rows }, { rows: countRows }] = await Promise.all([
        pool.query(query),
        pool.query(countQuery)
      ]);
      
      const total = parseInt(countRows[0].count);
      
      return {
        data: rows.map(this.mapToNotification),
        total,
        page,
        limit
      };
    } catch (error) {
      logError('Error in getAll notifications', String(error));
      throw error;
    }
  }

  async getById(id: string): Promise<ServiceResult<Notification>> {
    try {
      const query = SQL`
        SELECT *
        FROM notifications
        WHERE id = ${id}
      `;
      
      const { rows } = await pool.query(query);
      
      if (!rows[0]) {
        throw new NotificationNotFoundError(id);
      }
      
      return {
        success: true,
        data: this.mapToNotification(rows[0])
      };
    } catch (error) {
      logError(`Error getting notification by id: ${id}`, String(error));
      throw error;
    }
  }

  async create(data: CreateNotificationData): Promise<ServiceResult<Notification>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { title, message, priority = 'medium', targetAudience, scheduledFor, expiresAt } = data;
      const id = createUUID(v4());
      
      const query = SQL`
        INSERT INTO notifications (
          id, title, message, priority, target_audience, status, scheduled_for, expires_at, created_at, updated_at
        ) VALUES (
          ${id}, ${title}, ${message}, ${priority}, ${targetAudience}, 'active', ${scheduledFor}, ${expiresAt}, NOW(), NOW()
        ) RETURNING *
      `;
      
      const { rows: [notification] } = await client.query(query);
      
      await client.query('COMMIT');
      
      logInfo('Created new notification', { id });
      
      return {
        success: true,
        data: this.mapToNotification(notification)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logError('Error creating notification', String(error));
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, data: UpdateNotificationData): Promise<ServiceResult<Notification>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if notification exists
      const existingNotification = await this.getById(id);
      if (!existingNotification.data) {
        throw new NotificationNotFoundError(id);
      }
      
      const updateFields: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;
      
      if (data.title) {
        updateFields.push(`title = $${valueIndex}`);
        values.push(data.title);
        valueIndex++;
      }
      
      if (data.message) {
        updateFields.push(`message = $${valueIndex}`);
        values.push(data.message);
        valueIndex++;
      }
      
      if (data.priority) {
        updateFields.push(`priority = $${valueIndex}`);
        values.push(data.priority);
        valueIndex++;
      }
      
      if (data.status) {
        updateFields.push(`status = $${valueIndex}`);
        values.push(data.status);
        valueIndex++;
      }
      
      if (data.targetAudience) {
        updateFields.push(`target_audience = $${valueIndex}`);
        values.push(data.targetAudience);
        valueIndex++;
      }
      
      if (data.scheduledFor) {
        updateFields.push(`scheduled_for = $${valueIndex}`);
        values.push(data.scheduledFor);
        valueIndex++;
      }
      
      if (data.expiresAt) {
        updateFields.push(`expires_at = $${valueIndex}`);
        values.push(data.expiresAt);
        valueIndex++;
      }
      
      updateFields.push(`updated_at = NOW()`);
      
      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE notifications 
          SET ${updateFields.join(', ')}
          WHERE id = $${valueIndex}
          RETURNING *
        `;
        values.push(id);
        
        const { rows: [notification] } = await client.query(updateQuery, values);
        
        await client.query('COMMIT');
        
        logInfo('Updated notification', { id });
        
        return {
          success: true,
          data: this.mapToNotification(notification)
        };
      }
      
      return existingNotification;
    } catch (error) {
      await client.query('ROLLBACK');
      logError(`Error updating notification: ${id}`, String(error));
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<ServiceResult<null>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if notification exists
      await this.getById(id);
      
      // Soft delete by updating status
      await client.query(
        'UPDATE notifications SET status = $1, updated_at = NOW() WHERE id = $2',
        ['deleted', id]
      );
      
      await client.query('COMMIT');
      
      logInfo('Deleted notification', { id });
      
      return {
        success: true,
        data: null
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logError(`Error deleting notification: ${id}`, String(error));
      throw error;
    } finally {
      client.release();
    }
  }

  private mapToNotification(row: any): Notification {
    return {
      id: row.id,
      title: row.title,
      message: row.message,
      priority: row.priority,
      targetAudience: row.target_audience,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      scheduledFor: row.scheduled_for,
      expiresAt: row.expires_at
    };
  }
}

export const notificationService = NotificationService.getInstance();
