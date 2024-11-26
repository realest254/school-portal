import { Database } from 'sqlite3';
import { UserRole } from '../../middlewares/auth.middleware';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

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

export class NotificationTestService {
  private static instance: NotificationTestService;
  private db: Database;

  private constructor() {
    this.db = new Database(':memory:');
  }

  public static getInstance(): NotificationTestService {
    if (!NotificationTestService.instance) {
      NotificationTestService.instance = new NotificationTestService();
    }
    return NotificationTestService.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create notifications table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
            target_audience TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'deleted')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async cleanup(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DROP TABLE IF EXISTS notifications', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
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
    return new Promise((resolve, reject) => {
      try {
        // Validate inputs
        z.number().positive().parse(page);
        z.number().positive().max(100).parse(limit);
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
            reject(new Error(`Failed to get notifications count: ${err.message}`));
            return;
          }

          const total = row.count;

          // Add pagination
          query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
          params.push(limit, offset);

          this.db.all(query, params, (err, notifications: Notification[]) => {
            if (err) {
              reject(new Error(`Failed to get notifications: ${err.message}`));
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
        reject(new Error(`Failed to get notifications: ${error.message}`));
      }
    });
  }

  async getById(id: string): Promise<Notification | null> {
    return new Promise((resolve, reject) => {
      try {
        // Validate UUID
        UUIDSchema.parse(id);

        this.db.get(
          'SELECT * FROM notifications WHERE id = ? AND status != ?',
          [id, 'deleted'],
          (err, notification: any) => {
            if (err) {
              reject(new Error(`Failed to get notification: ${err.message}`));
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
        reject(new Error(`Failed to get notification: ${error.message}`));
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
        UUIDSchema.parse(userId);
        z.enum(['admin', 'teacher', 'student']).parse(role);
        z.number().positive().parse(page);
        z.number().positive().max(100).parse(limit);

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
            reject(new Error(`Failed to get notifications count: ${err.message}`));
            return;
          }

          const total = row.count;

          this.db.all(query, [rolePattern, limit, offset], (err, notifications: any[]) => {
            if (err) {
              reject(new Error(`Failed to get notifications: ${err.message}`));
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
        reject(new Error(`Failed to get notifications for recipient: ${error.message}`));
      }
    });
  }

  async create(data: any): Promise<Notification> {
    return new Promise((resolve, reject) => {
      try {
        // Validate input data
        const NotificationSchema = z.object({
          title: z.string(),
          message: z.string(),
          priority: PrioritySchema,
          target_audience: z.array(z.string()),
          expires_at: z.date().optional()
        });

        NotificationSchema.parse(data);

        const id = uuidv4();
        const params = [
          id,
          data.title,
          data.message,
          data.priority,
          JSON.stringify(data.target_audience),
          'active',
          data.expires_at?.toISOString()
        ];

        this.db.run(`
          INSERT INTO notifications (
            id, title, message, priority, target_audience, status, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, params, function(err) {
          if (err) {
            reject(new Error(`Failed to create notification: ${err.message}`));
            return;
          }

          // Get the created notification
          this.db.get('SELECT * FROM notifications WHERE id = ?', [id], (err, notification: any) => {
            if (err) {
              reject(new Error(`Failed to get created notification: ${err.message}`));
              return;
            }

            resolve({
              ...notification,
              created_at: new Date(notification.created_at),
              expires_at: notification.expires_at ? new Date(notification.expires_at) : undefined,
              target_audience: JSON.parse(notification.target_audience)
            });
          });
        });
      } catch (error: any) {
        reject(new Error(`Failed to create notification: ${error.message}`));
      }
    });
  }

  async update(id: string, data: any): Promise<Notification> {
    return new Promise((resolve, reject) => {
      try {
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
            reject(new Error(`Failed to update notification: ${err.message}`));
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
        reject(new Error(`Failed to update notification: ${error.message}`));
      }
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Validate UUID
        UUIDSchema.parse(id);

        this.db.run(
          'UPDATE notifications SET status = ? WHERE id = ?',
          ['deleted', id],
          (err) => {
            if (err) {
              reject(new Error(`Failed to delete notification: ${err.message}`));
              return;
            }
            resolve();
          }
        );
      } catch (error: any) {
        reject(new Error(`Failed to delete notification: ${error.message}`));
      }
    });
  }
}

export const notificationTestService = NotificationTestService.getInstance();
