import { Database } from 'sqlite3';
import SQL from 'sql-template-strings';
import { 
  Invite,
  InviteStatus,
  UserRole,
  CreateInviteDto,
  BulkInviteDto,
  InviteResult,
  BulkInviteResult,
  TokenData,
  InviteToken,
  createInviteToken,
  stringToInviteToken,
  parseInviteToken,
  getTokenString
} from '../../types/invite.types';
import { ServiceError } from '../../types/common.types';
import { v4 as uuidv4 } from 'uuid';

export class InviteTestService {
  private static instance: InviteTestService;
  private db: Database;
  private readonly ALLOWED_DOMAINS = ['school.edu', 'district.edu'];

  private constructor() {
    this.db = new Database(':memory:');
  }

  public static getInstance(): InviteTestService {
    if (!InviteTestService.instance) {
      InviteTestService.instance = new InviteTestService();
    }
    return InviteTestService.instance;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create invites table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS invites (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
            invited_by TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
            token TEXT UNIQUE,
            expiration_date DATETIME NOT NULL,
            used_at DATETIME,
            used_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            cancelled_by TEXT,
            cancelled_at DATETIME
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
      this.db.run('DROP TABLE IF EXISTS invites', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async validateEmailDomain(email: string, role: UserRole): Promise<{ valid: boolean; message?: string }> {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return { valid: false, message: 'Invalid email format' };
    }
    if (role === UserRole.TEACHER) {
      if (!this.ALLOWED_DOMAINS.includes(domain)) {
        return { valid: false, message: `Email domain ${domain} is not allowed` };
      }
    }
    return { valid: true };
  }

  generateToken(data: Omit<TokenData, 'exp'>): InviteToken {
    const tokenData: TokenData = {
      ...data,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    return createInviteToken(tokenData);
  }

  async createInvite(data: CreateInviteDto): Promise<InviteResult> {
    return new Promise((resolve, reject) => {
      // Validate email domain
      this.validateEmailDomain(data.email, data.role).then(domainCheck => {
        if (!domainCheck.valid) {
          reject(new ServiceError(domainCheck.message || 'Invalid email domain', 'INVALID_EMAIL_DOMAIN', 400));
          return;
        }

        const id = uuidv4();
        const token = this.generateToken({
          id,
          email: data.email,
          role: data.role
        });

        let expiration: Date;
        try {
          if (data.expiration_date) {
            const date = new Date(data.expiration_date);
            if (isNaN(date.getTime())) {
              throw new ServiceError('Invalid expiration date', 'INVALID_EXPIRATION_DATE', 400);
            }
            expiration = date;
          } else {
            expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          }
        } catch (error) {
          reject(new ServiceError('Invalid expiration date', 'INVALID_EXPIRATION_DATE', 400));
          return;
        }

        this.db.run(`
          INSERT INTO invites (
            id, email, role, invited_by, status, token, expiration_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          data.email,
          data.role,
          data.invited_by,
          InviteStatus.PENDING,
          getTokenString(token),
          expiration.toISOString()
        ], (err: Error | null) => {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(new ServiceError('Email already invited', 'DUPLICATE_EMAIL', 409));
            } else {
              reject(new ServiceError(err.message, 'CREATE_INVITE_FAILED', 500));
            }
            return;
          }

          // Use a new query to get the inserted invite
          this.db.get('SELECT * FROM invites WHERE id = ?', [id], (err: Error | null, invite: Invite | undefined) => {
            if (err) {
              reject(new ServiceError(err.message, 'CREATE_INVITE_FAILED', 500));
              return;
            }
            resolve({ success: true, invite });
          });
        });
      }).catch(reject);
    });
  }

  async getById(id: string): Promise<Invite | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM invites WHERE id = ?', [id], (err: Error | null, invite: Invite | undefined) => {
        if (err) {
          reject(new ServiceError(err.message, 'GET_INVITE_FAILED', 500));
          return;
        }
        resolve(invite || null);
      });
    });
  }

  async getInviteHistory(email: string): Promise<Invite[]> {
    return new Promise((resolve, reject) => {
      this.db.all<Invite>(
        'SELECT * FROM invites WHERE email = ? ORDER BY created_at DESC',
        [email],
        (err: Error | null, invites: Invite[]) => {
          if (err) {
            reject(new ServiceError(err.message, 'GET_INVITE_HISTORY_FAILED', 500));
            return;
          }
          resolve(invites || []);
        }
      );
    });
  }

  async checkInviteValidity(id: string): Promise<{ valid: boolean; message?: string }> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM invites WHERE id = ? AND status = ?',
        [id, InviteStatus.PENDING],
        (err, invite: any) => {
          if (err) {
            reject(new ServiceError(err.message, 'CHECK_INVITE_VALIDITY_FAILED', 500));
            return;
          }
          if (!invite) {
            resolve({ valid: false, message: 'Invite not found' });
            return;
          }

          const now = new Date();
          const expirationDate = new Date(invite.expiration_date);
          
          if (expirationDate < now) {
            resolve({ valid: false, message: 'Invite has expired' });
            return;
          }
          
          resolve({ valid: true });
        }
      );
    });
  }

  async markInviteAsUsed(id: string, acceptedBy: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // First check if invite exists and is still pending
      this.db.get(
        'SELECT * FROM invites WHERE id = ? AND status = ?',
        [id, InviteStatus.PENDING],
        (err: Error | null, invite: any) => {
          if (err) {
            reject(new ServiceError(err.message, 'MARK_INVITE_AS_USED_FAILED', 500));
            return;
          }
          
          if (!invite) {
            reject(new ServiceError('Invite not found or already used', 'INVALID_INVITE_STATUS', 400));
            return;
          }

          const now = new Date();
          const expirationDate = new Date(invite.expiration_date);
          
          if (expirationDate < now) {
            reject(new ServiceError('Invite has expired', 'INVITE_EXPIRED', 400));
            return;
          }

          // If invite is valid, update it
          this.db.run(
            `UPDATE invites 
             SET status = ?, used_at = datetime('now'), used_by = ?, updated_at = datetime('now')
             WHERE id = ? AND status = ?`,
            [InviteStatus.ACCEPTED, acceptedBy, id, InviteStatus.PENDING],
            (err) => {
              if (err) {
                reject(new ServiceError(err.message, 'MARK_INVITE_AS_USED_FAILED', 500));
                return;
              }
              resolve();
            }
          );
        }
      );
    });
  }

  async getInviteById(id: string): Promise<{ success: boolean; invite?: Invite }> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM invites WHERE id = ?',
        [id],
        (err, invite: Invite | undefined) => {
          if (err) {
            reject(new ServiceError(err.message, 'GET_INVITE_BY_ID_FAILED', 500));
            return;
          }
          if (!invite) {
            resolve({ success: false });
            return;
          }
          resolve({ success: true, invite });
        }
      );
    });
  }

  async decryptAndValidateToken(token: string): Promise<{ 
    valid: boolean; 
    reason?: 'expired' | 'invalid' | 'error'; 
    message?: string;
    invite?: {
      id: string;
      email: string;
      role: UserRole;
      status: InviteStatus;
      expiration_date: Date;
    };
  }> {
    return new Promise((resolve, reject) => {
      try {
        const inviteToken = stringToInviteToken(token);
        const tokenData = parseInviteToken(inviteToken);

        // Validate token expiration
        if (new Date(tokenData.exp * 1000) < new Date()) {
          resolve({
            valid: false,
            reason: 'expired',
            message: 'Invite token has expired'
          });
          return;
        }

        this.db.get(
          'SELECT * FROM invites WHERE id = ?',
          [tokenData.id],
          (err: Error | null, invite: Invite | undefined) => {
            if (err) {
              reject(new ServiceError(err.message, 'VALIDATE_TOKEN_FAILED', 500));
              return;
            }

            if (!invite) {
              resolve({
                valid: false,
                reason: 'invalid',
                message: 'Invite not found'
              });
              return;
            }

            if (invite.status !== InviteStatus.PENDING) {
              resolve({
                valid: false,
                reason: 'invalid',
                message: `Invite is ${invite.status.toLowerCase()}`
              });
              return;
            }

            resolve({
              valid: true,
              invite: {
                id: invite.id,
                email: invite.email,
                role: invite.role,
                status: invite.status,
                expiration_date: invite.expiration_date
              }
            });
          }
        );
      } catch (error) {
        resolve({
          valid: false,
          reason: 'invalid',
          message: 'Invalid token format'
        });
      }
    });
  }

  async acceptInvite(id: string, acceptedBy: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT token FROM invites WHERE id = ?',
        [id],
        async (err: Error | null, result: { token: string } | undefined) => {
          if (err) {
            reject(new ServiceError(err.message, 'ACCEPT_INVITE_FAILED', 500));
            return;
          }

          if (!result?.token) {
            reject(new ServiceError('Invite not found', 'INVITE_NOT_FOUND', 404));
            return;
          }

          try {
            // Validate the token first
            const validationResult = await this.decryptAndValidateToken(result.token);
            if (!validationResult.valid) {
              reject(new ServiceError(validationResult.message || 'Invalid invite', 'INVALID_INVITE', 400));
              return;
            }

            // Check if invite exists and is valid
            this.db.get(
              'SELECT * FROM invites WHERE id = ? AND status = ?',
              [id, InviteStatus.PENDING],
              (err: Error | null, invite: Invite | undefined) => {
                if (err) {
                  reject(new ServiceError(err.message, 'ACCEPT_INVITE_FAILED', 500));
                  return;
                }

                if (!invite) {
                  reject(new ServiceError('Invite not found', 'INVITE_NOT_FOUND', 404));
                  return;
                }

                if (invite.status !== InviteStatus.PENDING) {
                  reject(new ServiceError('Invite already accepted', 'INVITE_ALREADY_ACCEPTED', 400));
                  return;
                }

                const now = new Date();
                const expirationDate = new Date(invite.expiration_date);

                if (expirationDate < now) {
                  reject(new ServiceError('Invite has expired', 'INVITE_EXPIRED', 400));
                  return;
                }

                // Update the invite
                this.db.run(
                  `UPDATE invites 
                   SET status = ?, 
                       used_at = CURRENT_TIMESTAMP,
                       used_by = ?,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = ? 
                   AND status = ?
                   AND expiration_date > CURRENT_TIMESTAMP`,
                  [InviteStatus.ACCEPTED, acceptedBy, id, InviteStatus.PENDING],
                  function(err) {
                    if (err) {
                      reject(new ServiceError(err.message, 'ACCEPT_INVITE_FAILED', 500));
                      return;
                    }
                    if (this.changes === 0) {
                      reject(new ServiceError('Invite already accepted or expired', 'INVALID_INVITE_STATE', 400));
                      return;
                    }
                    resolve({ success: true });
                  }
                );
              }
            );
          } catch (error) {
            reject(new ServiceError('Invalid token format', 'INVALID_TOKEN', 400));
          }
        }
      );
    });
  }

  async getAll(page: number = 1, limit: number = 10, filters: { role?: string; status?: string; email?: string } = {}): Promise<{ invites: Invite[]; total: number }> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM invites WHERE 1=1';
      const params: any[] = [];

      if (filters.role) {
        query += ' AND role = ?';
        params.push(filters.role);
      }

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.email) {
        query += ' AND email = ?';
        params.push(filters.email);
      }

      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');

      this.db.get(countQuery, params, (err, result: any) => {
        if (err) {
          reject(new ServiceError(err.message, 'GET_ALL_INVITES_FAILED', 500));
          return;
        }

        const offset = (page - 1) * limit;
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        this.db.all<Invite>(query, params, (err: Error | null, invites: Invite[]) => {
          if (err) {
            reject(new ServiceError(err.message, 'GET_ALL_INVITES_FAILED', 500));
            return;
          }
          resolve({
            invites: invites || [],
            total: result.count
          });
        });
      });
    });
  }

  async createBulkInvites(data: BulkInviteDto): Promise<BulkInviteResult> {
    return new Promise((resolve, reject) => {
      const successful: BulkInviteResult['successful'] = [];
      const failed: BulkInviteResult['failed'] = [];

      // Use serialize to ensure sequential processing
      this.db.serialize(async () => {
        this.db.run('BEGIN TRANSACTION');

        try {
          for (const invite of data.invites) {
            try {
              const domainCheck = await this.validateEmailDomain(invite.email, invite.role);
              if (!domainCheck.valid) {
                throw new ServiceError(domainCheck.message || 'Invalid email domain', 'INVALID_EMAIL_DOMAIN', 400);
              }

              const createdInvite = await this.createInvite({
                email: invite.email,
                role: invite.role,
                invited_by: data.invited_by,
                expiration_date: data.expiration_date
              });

              if (!createdInvite.success || !createdInvite.invite) {
                throw new ServiceError(createdInvite.message || 'Failed to create invite', 'CREATE_INVITE_FAILED', 500);
              }

              successful.push({
                email: invite.email,
                role: invite.role,
                invite: createdInvite.invite
              });
            } catch (error) {
              const inviteError = error instanceof ServiceError 
                ? error 
                : new ServiceError(
                    error instanceof Error ? error.message : 'Unknown error',
                    'BULK_INVITE_ERROR',
                    500
                  );

              failed.push({
                email: invite.email,
                role: invite.role,
                reason: inviteError.message,
                error: inviteError
              });
            }
          }

          this.db.run('COMMIT');
          resolve({ successful, failed });
        } catch (error) {
          this.db.run('ROLLBACK');
          
          const finalError = error instanceof ServiceError 
            ? error 
            : new ServiceError(
                error instanceof Error ? error.message : 'Bulk invite operation failed',
                'BULK_INVITE_FAILED',
                500
              );

          reject(finalError);
        }
      });
    });
  }

  async cancelInvite(id: string, cancelledBy: string): Promise<InviteResult> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM invites WHERE id = ? AND status = ?',
        [id, InviteStatus.PENDING],
        (err: Error | null, invite: Invite | undefined) => {
          if (err) {
            reject(new ServiceError(err.message, 'CANCEL_INVITE_FAILED', 500));
            return;
          }

          if (!invite) {
            reject(new ServiceError('Invite not found or already processed', 'INVITE_NOT_FOUND', 404));
            return;
          }

          this.db.run(
            `UPDATE invites 
             SET status = ?, 
                 updated_at = CURRENT_TIMESTAMP,
                 cancelled_by = ?,
                 cancelled_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = ?`,
            [InviteStatus.CANCELLED, cancelledBy, id, InviteStatus.PENDING],
            function(err) {
              if (err) {
                reject(new ServiceError(err.message, 'CANCEL_INVITE_FAILED', 500));
                return;
              }
              if (this.changes === 0) {
                reject(new ServiceError('Invite already processed', 'INVALID_INVITE_STATE', 400));
                return;
              }
              resolve({ success: true, invite });
            }
          );
        }
      );
    });
  }

  async cleanupExpiredInvites(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE invites 
         SET status = ?, 
             updated_at = CURRENT_TIMESTAMP
         WHERE status = ? 
         AND expiration_date < CURRENT_TIMESTAMP`,
        [InviteStatus.EXPIRED, InviteStatus.PENDING],
        function(err) {
          if (err) {
            reject(new ServiceError(err.message, 'CLEANUP_EXPIRED_INVITES_FAILED', 500));
            return;
          }
          resolve();
        }
      );
    });
  }

  async resendInvite(id: string): Promise<InviteResult> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM invites WHERE id = ?',
        [id],
        async (err: Error | null, invite: Invite | undefined) => {
          if (err) {
            reject(new ServiceError(err.message, 'RESEND_INVITE_FAILED', 500));
            return;
          }

          if (!invite) {
            reject(new ServiceError('Invite not found', 'INVITE_NOT_FOUND', 404));
            return;
          }

          if (invite.status !== InviteStatus.PENDING) {
            reject(new ServiceError(`Cannot resend ${invite.status.toLowerCase()} invite`, 'INVALID_INVITE_STATE', 400));
            return;
          }

          // Update expiration date and token
          const newExpirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const token = this.generateToken({
            id: invite.id,
            email: invite.email,
            role: invite.role
          });

          this.db.run(
            `UPDATE invites 
             SET expiration_date = ?,
                 token = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [newExpirationDate.toISOString(), getTokenString(token), id],
            function(err) {
              if (err) {
                reject(new ServiceError(err.message, 'RESEND_INVITE_FAILED', 500));
                return;
              }
              if (this.changes === 0) {
                reject(new ServiceError('Failed to update invite', 'UPDATE_INVITE_FAILED', 500));
                return;
              }
              resolve({ 
                success: true, 
                invite: { 
                  ...invite, 
                  expiration_date: newExpirationDate 
                } 
              });
            }
          );
        }
      );
    });
  }
}

export const inviteTestService = InviteTestService.getInstance();
