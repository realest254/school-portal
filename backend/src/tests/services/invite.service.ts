import { Database } from 'sqlite3';
import SQL from 'sql-template-strings';
import logger, { logError } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { 
  UserRole, 
  InviteStatus, 
  Invite, 
  CreateInviteDto, 
  BulkInviteDto, 
  InviteResult, 
  BulkInviteResult
} from '../../types/invite.types';
import { mockRedis } from '../mocks/redis.mock';
import { TestRateLimiter, RateLimitError } from '../mocks/rate-limiter.mock';
import {
  logInviteCreated,
  logInviteAccepted,
  logInviteError
} from '../../utils/audit-logger';

// Error classes
export class InviteError extends Error {
  constructor(message: string, public code: string, public status: number = 400) {
    super(message);
    this.name = 'InviteError';
  }
}

export class DomainError extends Error {
  constructor(message: string = 'Invalid domain') {
    super(message);
    this.name = 'DomainError';
  }
}

export class SpamError extends Error {
  constructor(message: string = 'Spam detected') {
    super(message);
    this.name = 'SpamError';
  }
}

export class InviteTestService {
  private static instance: InviteTestService;
  private readonly db: Database;
  private readonly INVITE_EXPIRY_DAYS = 7;
  private readonly INVITE_CACHE_TTL = 3600; // 1 hour
  private readonly ALLOWED_DOMAINS = ['school.edu', 'district.edu'];

  constructor() {
    this.db = new Database(':memory:');
    this.initialize().catch(console.error);
  }

  public static getInstance(): InviteTestService {
    if (!InviteTestService.instance) {
      InviteTestService.instance = new InviteTestService();
    }
    return InviteTestService.instance;
  }

  public async initialize(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`CREATE TABLE IF NOT EXISTS invites (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          role TEXT NOT NULL,
          status TEXT NOT NULL,
          invited_by TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          accepted_at DATETIME,
          accepted_by TEXT
        )`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  public async getAllInvites(): Promise<Invite[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM invites', (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const invites = rows.map(row => ({
            id: row.id,
            email: row.email,
            role: row.role as UserRole,
            status: row.status as InviteStatus,
            invited_by: row.invited_by,
            expires_at: new Date(row.expires_at),
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at),
            accepted_at: row.accepted_at ? new Date(row.accepted_at) : null,
            accepted_by: row.accepted_by
          })) as Invite[];
          resolve(invites);
        }
      });
    });
  }

  private async validateEmailDomain(email: string, role: UserRole): Promise<void> {
    const domain = email.split('@')[1];
    if (!this.ALLOWED_DOMAINS.includes(domain)) {
      throw new DomainError(`Email domain ${domain} is not allowed`);
    }
  }

  private async checkInviteSpam(email: string): Promise<{ isSpam: boolean; message?: string }> {
    try {
      const spamKey = `spam:invite:${email}`;
      const count = await mockRedis.get(spamKey);
      
      if (count && parseInt(count) > 3) {
        throw new SpamError();
      }

      // Increment the counter
      await mockRedis.setex(spamKey, 86400, (count ? parseInt(count) + 1 : 1).toString()); // 24 hours
      return { isSpam: false };
    } catch (error) {
      if (error instanceof SpamError) {
        throw error;
      }
      logger.error('Error checking invite spam:', error);
      throw new InviteError('Failed to check invite spam', 'CHECK_INVITE_SPAM_FAILED', 500);
    }
  }

  async createInvite(data: CreateInviteDto, ip?: string): Promise<InviteResult> {
    try {
      // Basic input validation
      if (!data.email?.trim()) {
        throw new InviteError('Email is required', 'INVALID_EMAIL', 400);
      }
      if (!data.invited_by?.trim()) {
        throw new InviteError('Invited by is required', 'INVALID_INVITED_BY', 400);
      }
      
      // Validate role
      if (!Object.values(UserRole).includes(data.role as UserRole)) {
        throw new InviteError('Invalid role', 'INVALID_ROLE', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new InviteError('Invalid email format', 'INVALID_EMAIL_FORMAT', 400);
      }

      // Validate email domain
      await this.validateEmailDomain(data.email, data.role);

      // Check IP rate limit if provided
      if (ip) {
        await TestRateLimiter.checkIpLimit(ip);
      }

      // Check email rate limit
      await TestRateLimiter.checkEmailLimit(data.email);

      // Check for spam/rate limiting
      await this.checkInviteSpam(data.email);

      // Generate unique ID
      const id = uuidv4();

      // Set expiration to 7 days from now
      const now = new Date();
      const expires_at = new Date(now.getTime() + (this.INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

      // Create invite
      const invite = await new Promise<Invite>((resolve, reject) => {
        this.db.get(
          `INSERT INTO invites (
            id, email, role, status, invited_by, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *`,
          [
            id,
            data.email,
            data.role,
            InviteStatus.PENDING,
            data.invited_by,
            expires_at
          ],
          (err, row: any) => {
            if (err) reject(err);
            else {
              const inviteData: Invite = {
                id: row.id,
                email: row.email,
                role: row.role as UserRole,
                status: row.status as InviteStatus,
                invited_by: row.invited_by,
                token: null,
                expires_at: new Date(row.expires_at),
                created_at: new Date(row.created_at),
                updated_at: new Date(row.updated_at),
                accepted_at: row.accepted_at ? new Date(row.accepted_at) : null,
                accepted_by: row.accepted_by
              };
              resolve(inviteData);
            }
          }
        );
      });

      // Log successful creation
      logInviteCreated(data.invited_by, data.role, invite.id, data.email, data.role, ip);

      return {
        success: true,
        invite
      };
    } catch (error) {
      // Preserve specific error types
      if (
        error instanceof DomainError || 
        error instanceof SpamError || 
        error instanceof RateLimitError ||
        error instanceof InviteError
      ) {
        throw error;
      }

      // Log error
      const finalError = new InviteError(
        error instanceof Error ? error.message : 'Failed to create invite',
        'CREATE_INVITE_FAILED',
        500
      );

      logInviteError(
        'INVITE_CREATION_FAILED',
        data.invited_by,
        data.role,
        finalError,
        { email: data.email },
        ip
      );

      throw finalError;
    }
  }

  async acceptInvite(id: string, email: string, role: string, acceptedBy: string): Promise<{ success: boolean; invite?: Invite }> {
    try {
      // Get invite from database
      const invite = await new Promise<any>((resolve, reject) => {
        this.db.get('SELECT * FROM invites WHERE id = ? AND email = ? AND role = ? AND status = ?', 
          [id, email, role, InviteStatus.PENDING], 
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!invite) {
        throw new InviteError('Invalid invite or already accepted', 'INVALID_INVITE');
      }

      // Check if invite has expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new InviteError('Invite has expired', 'INVITE_EXPIRED');
      }

      // Begin transaction
      await new Promise<void>((resolve, reject) => {
        this.db.run('BEGIN TRANSACTION', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      try {
        // Update invite status
        await new Promise<void>((resolve, reject) => {
          this.db.run(`
            UPDATE invites 
            SET status = ?, accepted_by = ?, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = ?
          `, [InviteStatus.ACCEPTED, acceptedBy, invite.id, InviteStatus.PENDING],
          (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Get updated invite
        const updatedInvite = await new Promise<Invite>((resolve, reject) => {
          this.db.get('SELECT * FROM invites WHERE id = ?', [invite.id], (err, row: any) => {
            if (err) reject(err);
            else resolve({
              id: row.id,
              email: row.email,
              role: row.role as UserRole,
              status: row.status as InviteStatus,
              invited_by: row.invited_by,
              expires_at: new Date(row.expires_at),
              created_at: new Date(row.created_at),
              updated_at: new Date(row.updated_at),
              accepted_at: row.accepted_at ? new Date(row.accepted_at) : null,
              accepted_by: row.accepted_by
            } as Invite);
          });
        });

        if (!updatedInvite) {
          throw new InviteError('Failed to accept invite', 'ACCEPT_INVITE_FAILED');
        }

        // Update cache
        await mockRedis.setex(
          `invite:${updatedInvite.id}`,
          this.INVITE_CACHE_TTL,
          JSON.stringify(updatedInvite)
        );

        // Commit transaction
        await new Promise<void>((resolve, reject) => {
          this.db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Log successful acceptance
        logInviteAccepted(acceptedBy, updatedInvite.role as UserRole, updatedInvite.id, updatedInvite.email);

        return {
          success: true,
          invite: updatedInvite
        };
      } catch (error) {
        // Rollback transaction on error
        await new Promise<void>((resolve) => {
          this.db.run('ROLLBACK', () => resolve());
        });
        throw error;
      }
    } catch (error) {
      if (error instanceof InviteError) {
        throw error;
      }
      throw new InviteError(
        error instanceof Error ? error.message : 'Failed to accept invite',
        'ACCEPT_INVITE_FAILED',
        500
      );
    }
  }

  async bulkCreateInvites(data: BulkInviteDto, ip?: string): Promise<BulkInviteResult> {
    const results: BulkInviteResult = {
      successful: [],
      failed: []
    };

    for (const { email, role } of data.invites) {
      try {
        const inviteResult = await this.createInvite({
          email,
          role,
          invited_by: data.invited_by
        }, ip);

        if (inviteResult.success && inviteResult.invite) {
          results.successful.push({
            email,
            role,
            invite: inviteResult.invite
          });
        }
      } catch (error) {
        results.failed.push({
          email,
          role,
          reason: error instanceof Error ? error.message : 'Unknown error',
          error: error instanceof InviteError ? error : new InviteError(
            error instanceof Error ? error.message : 'Unknown error',
            'BULK_INVITE_FAILED'
          )
        });
      }
    }

    return results;
  }

  async cleanupExpiredInvites(): Promise<void> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          // Begin transaction
          await new Promise<void>((resolve, reject) => {
            this.db.run('BEGIN TRANSACTION', (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          // Get expired invites
          const expiredInvites = await new Promise<any[]>((resolve, reject) => {
            this.db.all(`
              SELECT id FROM invites 
              WHERE status = ? AND expires_at < CURRENT_TIMESTAMP
            `, [InviteStatus.PENDING], (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            });
          });

          // Update expired invites
          if (expiredInvites.length > 0) {
            await new Promise<void>((resolve, reject) => {
              this.db.run(`
                UPDATE invites 
                SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE status = ? AND expires_at < CURRENT_TIMESTAMP
              `, [InviteStatus.EXPIRED, InviteStatus.PENDING], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });

            // Remove expired invites from cache
            for (const invite of expiredInvites) {
              await mockRedis.del(`invite:${invite.id}`);
            }
          }

          // Commit transaction
          await new Promise<void>((resolve, reject) => {
            this.db.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          resolve();
        } catch (error) {
          // Rollback transaction
          await new Promise<void>((resolve) => {
            this.db.run('ROLLBACK', () => resolve());
          });

          reject(new InviteError(
            error instanceof Error ? error.message : 'Failed to cleanup expired invites',
            'CLEANUP_EXPIRED_INVITES_FAILED',
            500
          ));
        }
      })();
    });
  }

  // Helper method to clear all data (useful for testing)
  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM invites', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Export singleton instance
export const inviteTestService = InviteTestService.getInstance();
