import { Database } from 'sqlite3';
import { UserRole } from '../../middlewares/auth.middleware';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Error handling
export enum NotificationErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND'
}

export const ErrorStatusMap = {
  [NotificationErrorCodes.VALIDATION_ERROR]: 400,
  [NotificationErrorCodes.DATABASE_ERROR]: 500,
  [NotificationErrorCodes.NOT_FOUND]: 404
};

export class NotificationError extends Error {
  constructor(
    message: string,
    public code: NotificationErrorCodes,
    public status: number = ErrorStatusMap[code],
    public details?: any
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

// Validation schemas
const UUIDSchema = z.string().uuid();
const StatusSchema = z.enum(['active', 'expired', 'deleted']);
const PrioritySchema = z.enum(['low', 'medium', 'high']);
const TargetAudienceSchema = z.enum(['admin', 'teacher', 'student']);
const CreateNotificationSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  message: z.string().min(1, "Message cannot be empty"),
  priority: PrioritySchema,
  target_audience: z.array(z.enum(['admin', 'teacher', 'student'])).min(1, "Target audience cannot be empty"),
  expires_at: z.date().optional()
});

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  target_audience: UserRole[];
  status: 'active' | 'expired' | 'deleted';
  created_at: Date;
  expires_at?: Date;
}

export interface NotificationFilters {
  priority?: string;
  status?: string;
  target_audience?: string;
  startDate?: Date;
  endDate?: Date;
}

export class NotificationTestService {
  private db: Database;

  constructor() {
    this.db = new Database(':memory:');
    // Initialize the database immediately
    this.db.serialize(() => {
      // Create notifications table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          priority TEXT NOT NULL,
          target_audience TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT,
          CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high')),
          CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'deleted'))
        )
      `);
    });
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async cleanup(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DROP TABLE IF EXISTS notifications', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private validateInputs(data: any, schema: z.ZodSchema) {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new NotificationError(
          'Validation failed',
          NotificationErrorCodes.VALIDATION_ERROR,
          undefined,
          error.errors
        );
      }
      throw error;
    }
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

  async getAll(
    page: number,
    limit: number,
    filters: NotificationFilters
  ): Promise<{ notifications: Notification[]; total: number }> {
    return new Promise((resolve, reject) => {
      try {
        // Validate inputs
        this.validateInputs({ page, limit }, z.object({
          page: z.number().positive(),
          limit: z.number().positive().max(100)
        }));
        this.validateFilters(filters);

        const offset = (page - 1) * limit;
        let query = 'SELECT * FROM notifications WHERE status != ?';
        const params: any[] = ['deleted'];

        if (filters.priority) {
          query += ' AND priority = ?';
          params.push(filters.priority);
        }

        if (filters.status) {
          query += ' AND status = ?';
          params.push(filters.status);
        }

        if (filters.target_audience) {
          query += ' AND target_audience LIKE ?';
          params.push(`%${filters.target_audience}%`);
        }

        if (filters.startDate) {
          query += ' AND created_at >= ?';
          params.push(filters.startDate.toISOString());
        }

        if (filters.endDate) {
          query += ' AND created_at <= ?';
          params.push(filters.endDate.toISOString());
        }

        // Get total count
        this.db.get(`SELECT COUNT(*) as count FROM (${query})`, params, (err, row: any) => {
          if (err) {
            reject(new NotificationError(`Failed to get notifications count: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
            return;
          }

          const total = row.count;

          // Add pagination
          query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
          params.push(limit, offset);

          this.db.all(query, params, (err, notifications: Notification[]) => {
            if (err) {
              reject(new NotificationError(`Failed to get notifications: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
              return;
            }

            resolve({
              notifications: notifications.map(n => ({
                ...n,
                created_at: new Date(n.created_at),
                expires_at: n.expires_at ? new Date(n.expires_at) : undefined,
                target_audience: JSON.parse(n.target_audience as any)
              })),
              total
            });
          });
        });
      } catch (error: any) {
        reject(new NotificationError(`Failed to get notifications: ${error.message}`, NotificationErrorCodes.VALIDATION_ERROR));
      }
    });
  }

  async getById(id: string): Promise<Notification | null> {
    return new Promise((resolve, reject) => {
      try {
        // Validate UUID
        this.validateInputs({ id }, z.object({
          id: UUIDSchema
        }));

        this.db.get(
          'SELECT * FROM notifications WHERE id = ? AND status != ?',
          [id, 'deleted'],
          (err, notification: any) => {
            if (err) {
              reject(new NotificationError(`Failed to get notification: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
              return;
            }

            if (!notification) {
              resolve(null);
              return;
            }

            resolve({
              ...notification,
              created_at: new Date(notification.created_at),
              expires_at: notification.expires_at ? new Date(notification.expires_at) : undefined,
              target_audience: JSON.parse(notification.target_audience)
            });
          }
        );
      } catch (error: any) {
        reject(new NotificationError(`Failed to get notification: ${error.message}`, NotificationErrorCodes.VALIDATION_ERROR));
      }
    });
  }

  async getForRecipient(
    userId: string,
    role: UserRole,
    page: number,
    limit: number
  ): Promise<{ notifications: Notification[]; total: number }> {
    return new Promise((resolve, reject) => {
      try {
        // Validate inputs
        this.validateInputs({ userId, role, page, limit }, z.object({
          userId: UUIDSchema,
          role: z.enum(['admin', 'teacher', 'student']),
          page: z.number().positive(),
          limit: z.number().positive().max(100)
        }));

        const offset = (page - 1) * limit;
        const query = `
          SELECT * FROM notifications
          WHERE status = 'active'
          AND target_audience LIKE ?
          AND (expires_at IS NULL OR expires_at > datetime('now'))
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `;

        const countQuery = `
          SELECT COUNT(*) as count FROM notifications
          WHERE status = 'active'
          AND target_audience LIKE ?
          AND (expires_at IS NULL OR expires_at > datetime('now'))
        `;

        const rolePattern = `%${role}%`;

        this.db.get(countQuery, [rolePattern], (err, row: any) => {
          if (err) {
            reject(new NotificationError(`Failed to get notifications count: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
            return;
          }

          const total = row.count;

          this.db.all(query, [rolePattern, limit, offset], (err, notifications: any[]) => {
            if (err) {
              reject(new NotificationError(`Failed to get notifications: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
              return;
            }

            resolve({
              notifications: notifications.map(n => ({
                ...n,
                created_at: new Date(n.created_at),
                expires_at: n.expires_at ? new Date(n.expires_at) : undefined,
                target_audience: JSON.parse(n.target_audience)
              })),
              total
            });
          });
        });
      } catch (error: any) {
        reject(new NotificationError(`Failed to get notifications for recipient: ${error.message}`, NotificationErrorCodes.VALIDATION_ERROR));
      }
    });
  }

  async create(data: any): Promise<Notification> {
    try {
      const id = uuidv4();
      const now = new Date();

      // Store reference to this for use in callbacks
      const self = this;

      return new Promise<Notification>((resolve, reject) => {
        this.validateInputs(data, CreateNotificationSchema);

        self.db.run(
          'INSERT INTO notifications (id, title, message, priority, target_audience, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            data.title,
            data.message,
            data.priority,
            JSON.stringify(data.target_audience),
            'active',
            now.toISOString(),
            data.expires_at?.toISOString()
          ],
          function(err: Error | null) {
            if (err) {
              reject(new NotificationError(`Failed to create notification: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
              return;
            }

            // Get the created notification
            self.db.get('SELECT * FROM notifications WHERE id = ?', [id], (err: Error | null, notification: any) => {
              if (err) {
                reject(new NotificationError(`Failed to get created notification: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
                return;
              }

              resolve({
                ...notification,
                created_at: new Date(notification.created_at),
                expires_at: notification.expires_at ? new Date(notification.expires_at) : undefined,
                target_audience: JSON.parse(notification.target_audience)
              });
            });
          }
        );
      });
    } catch (error) {
      throw new NotificationError(`Failed to create notification: ${error instanceof Error ? error.message : String(error)}`, NotificationErrorCodes.VALIDATION_ERROR);
    }
  }

  async update(id: string, data: any): Promise<Notification> {
    return new Promise((resolve, reject) => {
      try {
        // Validate inputs
        this.validateInputs({ id }, z.object({
          id: UUIDSchema
        }));
        const UpdateNotificationSchema = z.object({
          title: z.string().optional(),
          message: z.string().optional(),
          priority: PrioritySchema.optional(),
          target_audience: z.array(z.string()).optional(),
          expires_at: z.date().optional(),
          status: StatusSchema.optional()
        });

        this.validateInputs(data, UpdateNotificationSchema);

        const updates: string[] = [];
        const params: any[] = [];

        if (data.title !== undefined) {
          updates.push('title = ?');
          params.push(data.title);
        }
        if (data.message !== undefined) {
          updates.push('message = ?');
          params.push(data.message);
        }
        if (data.priority !== undefined) {
          updates.push('priority = ?');
          params.push(data.priority);
        }
        if (data.target_audience !== undefined) {
          updates.push('target_audience = ?');
          params.push(JSON.stringify(data.target_audience));
        }
        if (data.expires_at !== undefined) {
          updates.push('expires_at = ?');
          params.push(data.expires_at.toISOString());
        }
        if (data.status !== undefined) {
          updates.push('status = ?');
          params.push(data.status);
        }

        if (updates.length === 0) {
          throw new Error('No fields to update');
        }

        params.push(id);
        const query = `
          UPDATE notifications 
          SET ${updates.join(', ')} 
          WHERE id = ?
          RETURNING *
        `;

        this.db.get(query, params, (err, notification: any) => {
          if (err) {
            reject(new NotificationError(`Failed to update notification: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
            return;
          }

          resolve({
            ...notification,
            created_at: new Date(notification.created_at),
            expires_at: notification.expires_at ? new Date(notification.expires_at) : undefined,
            target_audience: JSON.parse(notification.target_audience)
          });
        });
      } catch (error: any) {
        reject(new NotificationError(`Failed to update notification: ${error.message}`, NotificationErrorCodes.VALIDATION_ERROR));
      }
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Validate UUID
        this.validateInputs({ id }, z.object({
          id: UUIDSchema
        }));

        this.db.run(
          'UPDATE notifications SET status = ? WHERE id = ?',
          ['deleted', id],
          (err) => {
            if (err) {
              reject(new NotificationError(`Failed to delete notification: ${err.message}`, NotificationErrorCodes.DATABASE_ERROR));
              return;
            }
            resolve();
          }
        );
      } catch (error: any) {
        reject(new NotificationError(`Failed to delete notification: ${error.message}`, NotificationErrorCodes.VALIDATION_ERROR));
      }
    });
  }
}
