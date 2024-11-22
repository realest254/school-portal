import { Pool } from 'pg';
import SQL from 'sql-template-strings';
import pool from '../db';
import { supabase } from '../config/supabase';
import { encrypt, decrypt } from '../utils/encryption';
import { redisClient } from '../config/redis';
import { RateLimiter } from '../utils/rate-limiter';
import logger, { logError } from '../utils/logger';
import { 
  logInviteCreated, 
  logInviteAccepted, 
  logInviteCancelled, 
  logInviteError 
} from '../utils/audit-logger';
import {
  Invite,
  InviteStatus,
  UserRole,
  CreateInviteDto,
  BulkInviteDto,
  InviteResult,
  BulkInviteResult,
  TokenData,
  InvalidTokenError,
  ExpiredTokenError,
  DomainError,
  SpamError,
  InviteError,
  InviteToken,
  createInviteToken,
  stringToInviteToken,
  parseInviteToken,
  getTokenString
} from '../types/invite.types';

export class InviteService {
  private static instance: InviteService;
  private readonly db: Pool;
  private readonly INVITE_CACHE_TTL = 3600; // 1 hour
  private readonly ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || ['school.edu', 'district.edu'];

  private constructor() {
    this.db = pool;
  }

  public static getInstance(): InviteService {
    if (!InviteService.instance) {
      InviteService.instance = new InviteService();
    }
    return InviteService.instance;
  }

  private async validateEmailDomain(email: string, role: UserRole): Promise<{ valid: boolean; message?: string }> {
    try {
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) {
        return { valid: false, message: 'Invalid email format' };
      }
      if (role === UserRole.TEACHER || role === UserRole.ADMIN) {
        if (!this.ALLOWED_DOMAINS.includes(domain)) {
          throw new DomainError(`Email domain ${domain} is not allowed`);
        }
      }
      return { valid: true };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new InviteError(error instanceof Error ? error.message : 'Invalid email domain', 'VALIDATE_EMAIL_DOMAIN_FAILED', 500);
    }
  }

  private async checkInviteSpam(email: string): Promise<{ isSpam: boolean; message?: string }> {
    try {
      const spamKey = `spam:invite:${email}`;
      const count = await redisClient.get(spamKey);
      
      if (count && parseInt(count.toString()) > 3) {
        throw new SpamError();
      }

      // Increment the counter
      await redisClient.set(spamKey, (count ? parseInt(count.toString()) + 1 : 1).toString(), 86400); // 24 hours
      return { isSpam: false };
    } catch (error) {
      if (error instanceof SpamError) {
        throw error;
      }
      logger.error('Error checking invite spam:', error);
      throw new InviteError('Failed to check invite spam', 'CHECK_INVITE_SPAM_FAILED', 500);
    }
  }

  generateToken(data: Omit<TokenData, 'exp'>): InviteToken {
    const tokenData: TokenData = {
      ...data,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };
    return createInviteToken(tokenData);
  }

  async createInvite(data: CreateInviteDto, ip?: string): Promise<InviteResult> {
    const client = await this.db.connect();
    try {
      // Check rate limits
      await RateLimiter.checkIpLimit(ip || 'unknown');
      await RateLimiter.checkEmailLimit(data.email);
      
      // Validate email domain
      const domainCheck = await this.validateEmailDomain(data.email, data.role);
      if (!domainCheck.valid) {
        throw new InviteError(domainCheck.message || 'Invalid email domain', 'INVALID_EMAIL_DOMAIN', 400);
      }
      
      // Check for spam
      const spamCheck = await this.checkInviteSpam(data.email);
      if (spamCheck.isSpam) {
        throw new InviteError(spamCheck.message || 'Too many invite attempts', 'SPAM_DETECTED', 429);
      }

      await client.query('BEGIN');
      
      const expiration = data.expiration_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Create invite with row-level locking
      const result = await client.query(SQL`
        INSERT INTO invites (
          email, role, status, invited_by, expiration_date
        ) VALUES (
          ${data.email}, ${data.role}, ${InviteStatus.PENDING}, ${data.invited_by}, ${expiration}
        ) RETURNING *
        FOR UPDATE
      `);

      const invite = result.rows[0];

      // Generate token with expiry
      const token = this.generateToken({
        id: invite.id,
        email: data.email,
        role: data.role
      });
      
      // Send invite email with retry logic
      const emailResult = await this.sendInviteEmail(invite, token);
      if (!emailResult.success) {
        const errorMessage = emailResult.error || 'Failed to send invite email';
        throw new InviteError(errorMessage, 'SEND_INVITE_EMAIL_FAILED', 500);
      }

      // Cache the invite
      await redisClient.set(`invite:${invite.id}`, invite, this.INVITE_CACHE_TTL);
      
      await client.query('COMMIT');

      // Log the successful invite creation
      logInviteCreated(data.invited_by, data.role, invite.id, data.email, data.role, ip);
      
      return {
        success: true,
        invite
      };
    } catch (error) {
      await client.query('ROLLBACK');
      
      const finalError = error instanceof InviteError 
        ? error 
        : new InviteError(
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
    } finally {
      client.release();
    }
  }

  async createBulkInvites(data: BulkInviteDto, ip?: string): Promise<BulkInviteResult> {
    const client = await this.db.connect();
    const successful: BulkInviteResult['successful'] = [];
    const failed: BulkInviteResult['failed'] = [];

    try {
      await client.query('BEGIN');

      for (const invite of data.invites) {
        try {
          const domainCheck = await this.validateEmailDomain(invite.email, invite.role);
          if (!domainCheck.valid) {
            throw new InviteError(domainCheck.message || 'Invalid email domain', 'INVALID_EMAIL_DOMAIN', 400);
          }
          const spamCheck = await this.checkInviteSpam(invite.email);
          if (spamCheck.isSpam) {
            throw new InviteError(spamCheck.message || 'Too many invite attempts', 'SPAM_DETECTED', 429);
          }

          const createdInvite = await this.createInvite(
            {
              email: invite.email,
              role: invite.role,
              invited_by: data.invited_by,
              expiration_date: data.expiration_date
            },
            ip
          );

          if (!createdInvite.success || !createdInvite.invite) {
            throw new InviteError(createdInvite.message || 'Failed to create invite', 'CREATE_INVITE_FAILED', 500);
          }

          successful.push({
            email: invite.email,
            role: invite.role,
            invite: createdInvite.invite
          });

          // Log successful creation
          logInviteCreated(
            data.invited_by,
            invite.role,
            createdInvite.invite.id,
            invite.email,
            invite.role,
            ip
          );
        } catch (error) {
          const inviteError = error instanceof InviteError 
            ? error 
            : new InviteError(
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

          logError(inviteError, 'BULK_INVITE_ITEM_FAILED');
        }
      }

      await client.query('COMMIT');
      return { successful, failed };
    } catch (error) {
      await client.query('ROLLBACK');
      
      const finalError = error instanceof InviteError 
        ? error 
        : new InviteError(
            error instanceof Error ? error.message : 'Bulk invite operation failed',
            'BULK_INVITE_FAILED',
            500
          );

      logInviteError(
        'BULK_INVITE_FAILED',
        data.invited_by,
        UserRole.ADMIN,
        finalError,
        { count: data.invites.length },
        ip
      );

      throw finalError;
    } finally {
      client.release();
    }
  }

  private async sendInviteEmail(invite: Invite, token: InviteToken): Promise<{ success: boolean; error?: string }> {
    try {
      const tokenString = getTokenString(token);
      await supabase.auth.admin.inviteUserByEmail(invite.email, {
        data: {
          role: invite.role,
          invite_id: invite.id
        },
        redirectTo: `${process.env.FRONTEND_URL}/signup?token=${tokenString}`,
        emailTemplate: {
          name: 'invite-user',
          data: {
            role: invite.role,
            schoolName: process.env.SCHOOL_NAME || 'School Portal',
            expiresIn: '7 days',
            inviteLink: `${process.env.FRONTEND_URL}/signup?token=${tokenString}`
          }
        }
      });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite email';
      return { success: false, error: errorMessage };
    }
  }

  async getById(id: string): Promise<Invite | null> {
    try {
      // Try to get from cache first
      const cached = await redisClient.get<Invite>(`invite:${id}`);
      if (cached) {
        return cached;
      }

      // If not in cache, get from database
      const result = await this.db.query(SQL`
        SELECT * FROM invites 
        WHERE id = ${id}
        FOR UPDATE
      `);
      
      const invite = result.rows[0] || null;

      // Cache the result if found
      if (invite) {
        await redisClient.set(`invite:${id}`, invite, this.INVITE_CACHE_TTL);
      }

      return invite;
    } catch (error) {
      logger.error('Error getting invite by ID:', error);
      throw new InviteError(error instanceof Error ? error.message : 'Failed to get invite by ID', 'GET_INVITE_BY_ID_FAILED', 500);
    }
  }

  async getInviteHistory(email: string): Promise<Invite[]> {
    try {
      const result = await this.db.query(SQL`
        SELECT * FROM invites 
        WHERE email = ${email} 
        ORDER BY created_at DESC
      `);
      return result.rows;
    } catch (error) {
      logger.error('Error getting invite history:', error);
      throw new InviteError(error instanceof Error ? error.message : 'Failed to get invite history', 'GET_INVITE_HISTORY_FAILED', 500);
    }
  }

  async checkInviteValidity(id: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const result = await this.db.query(SQL`
        SELECT * FROM invites 
        WHERE id = ${id} 
        AND status = ${InviteStatus.PENDING} 
        AND expiration_date > NOW()
      `);
      
      if (result.rows.length === 0) {
        return {
          valid: false,
          message: 'Invite is invalid or has expired'
        };
      }
      
      return { valid: true };
    } catch (error) {
      logger.error('Error checking invite validity:', error);
      throw new InviteError(error instanceof Error ? error.message : 'Failed to check invite validity', 'CHECK_INVITE_VALIDITY_FAILED', 500);
    }
  }

  async markInviteAsUsed(id: string, acceptedBy: string): Promise<void> {
    try {
      await this.db.query(SQL`
        UPDATE invites 
        SET status = ${InviteStatus.ACCEPTED}, 
            accepted_at = NOW(),
            accepted_by = ${acceptedBy}
        WHERE id = ${id}
        AND status = ${InviteStatus.PENDING}
        AND expiration_date > NOW()
      `);
    } catch (error) {
      logger.error('Error marking invite as used:', error);
      throw new InviteError(error instanceof Error ? error.message : 'Failed to mark invite as used', 'MARK_INVITE_AS_USED_FAILED', 500);
    }
  }

  async getAll(page: number, limit: number, filters: { role?: string; status?: string; email?: string } = {}): Promise<{ invites: Invite[]; total: number }> {
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
      logger.error('Error getting all invites:', error);
      throw new InviteError(error instanceof Error ? error.message : 'Failed to get all invites', 'GET_ALL_INVITES_FAILED', 500);
    }
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
    try {
      const inviteToken = stringToInviteToken(token);
      const tokenData = parseInviteToken(inviteToken);

      // Validate token expiration
      if (new Date(tokenData.exp) < new Date()) {
        return {
          valid: false,
          reason: 'expired',
          message: 'Invite token has expired'
        };
      }

      const invite = await this.getById(tokenData.id);
      if (!invite) {
        return {
          valid: false,
          reason: 'invalid',
          message: 'Invite not found'
        };
      }

      if (invite.status !== InviteStatus.PENDING) {
        return {
          valid: false,
          reason: 'invalid',
          message: `Invite is ${invite.status.toLowerCase()}`
        };
      }

      return {
        valid: true,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          expiration_date: invite.expiration_date
        }
      };
    } catch (error) {
      logError(error, 'decryptAndValidateToken');
      if (error instanceof InvalidTokenError) {
        return {
          valid: false,
          reason: 'invalid',
          message: 'Invalid token format'
        };
      }
      throw error;
    }
  }

  async acceptInvite(data: { id: string; email: string; role: string }): Promise<{ success: boolean; message?: string }> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Check if invite exists and is valid
      const validityCheck = await this.decryptAndValidateToken(data.id);
      if (!validityCheck.valid) {
        throw new InviteError(validityCheck.message || 'Invalid invite', 'INVALID_INVITE', 400);
      }

      // Get invite details
      const inviteResult = await client.query<Invite>(SQL`
        SELECT * FROM invites 
        WHERE id = ${data.id}
        AND status = ${InviteStatus.PENDING}
      `);

      if (inviteResult.rows.length === 0) {
        throw new InviteError('Invite not found or already used', 'INVITE_NOT_FOUND', 404);
      }

      const invite = inviteResult.rows[0];
      if (!invite) {
        throw new InviteError('Invite not found', 'INVITE_NOT_FOUND', 404);
      }

      // Validate email matches
      if (invite.email !== data.email) {
        throw new InviteError('Email does not match invite', 'EMAIL_MISMATCH', 400);
      }

      // Validate role matches
      if (invite.role !== data.role) {
        throw new InviteError('Role does not match invite', 'ROLE_MISMATCH', 400);
      }

      // Check domain validation
      const domainCheck = await this.validateEmailDomain(data.email, invite.role as UserRole);
      if (!domainCheck.valid) {
        throw new InviteError(domainCheck.message || 'Invalid email domain', 'INVALID_EMAIL_DOMAIN', 400);
      }

      // Check for spam
      const spamCheck = await this.checkInviteSpam(data.email);
      if (spamCheck.isSpam) {
        throw new InviteError(spamCheck.message || 'Too many invite attempts', 'SPAM_DETECTED', 429);
      }

      // Mark invite as accepted
      await this.markInviteAsUsed(data.id, data.email);

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof InviteError) {
        throw error;
      }
      throw new InviteError(error instanceof Error ? error.message : 'Failed to accept invite', 'ACCEPT_INVITE_FAILED', 500);
    } finally {
      client.release();
    }
  }

  async resendInvite(email: string, invited_by: string, ip?: string): Promise<InviteResult> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      
      // Check rate limits
      await RateLimiter.checkIpLimit(ip || 'unknown');
      await RateLimiter.checkEmailLimit(email);
      
      // Get the existing invite with row-level locking
      const existingInvite = await client.query(SQL`
        SELECT * FROM invites 
        WHERE email = ${email} 
        AND status = ${InviteStatus.PENDING}
        ORDER BY created_at DESC 
        LIMIT 1
        FOR UPDATE
      `);
      
      if (existingInvite.rows.length === 0) {
        throw new InviteError('No pending invite found for this email', 'NO_PENDING_INVITE', 404);
      }

      const invite = existingInvite.rows[0];

      // Check for spam
      const spamCheck = await this.checkInviteSpam(email);
      if (spamCheck.isSpam) {
        throw new InviteError(spamCheck.message || 'Too many invite attempts', 'SPAM_DETECTED', 429);
      }

      const expiration_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Update the invite with new expiration date
      const result = await client.query(SQL`
        UPDATE invites 
        SET expiration_date = ${expiration_date},
            invited_by = ${invited_by},
            updated_at = NOW()
        WHERE id = ${invite.id}
        AND status = ${InviteStatus.PENDING}
        RETURNING *
      `);

      const updatedInvite = result.rows[0];

      // Generate new token with expiry
      const token = this.generateToken({
        id: updatedInvite.id,
        email: updatedInvite.email,
        role: updatedInvite.role
      });

      // Resend invite email with retry logic
      const emailResult = await this.sendInviteEmail(updatedInvite, token);
      if (!emailResult.success) {
        const errorMessage = emailResult.error || 'Failed to resend invite email';
        throw new InviteError(errorMessage, 'SEND_INVITE_EMAIL_FAILED', 500);
      }

      // Update cache
      await redisClient.set(`invite:${updatedInvite.id}`, updatedInvite, this.INVITE_CACHE_TTL);
      
      await client.query('COMMIT');

      // Log the successful invite resend
      logInviteCreated(invited_by, updatedInvite.role, updatedInvite.id, email, updatedInvite.role, ip);
      
      return {
        success: true,
        invite: updatedInvite
      };
    } catch (error) {
      await client.query('ROLLBACK');
      
      const finalError = error instanceof InviteError 
        ? error 
        : new InviteError(
            error instanceof Error ? error.message : 'Failed to resend invite',
            'RESEND_INVITE_FAILED',
            500
          );

      logInviteError(
        'INVITE_RESEND_FAILED',
        invited_by,
        UserRole.ADMIN,
        finalError,
        { email },
        ip
      );

      throw finalError;
    } finally {
      client.release();
    }
  }

  async cancelInvite(id: string, cancelled_by: string, ip?: string): Promise<InviteResult> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Get invite with row-level locking
      const invite = await client.query(SQL`
        SELECT * FROM invites 
        WHERE id = ${id} 
        AND status = ${InviteStatus.PENDING}
        FOR UPDATE
      `);

      if (!invite.rows[0]) {
        throw new InviteError('Invite not found or already processed', 'INVITE_NOT_FOUND', 404);
      }

      // Update invite status
      const result = await client.query(SQL`
        UPDATE invites 
        SET status = ${InviteStatus.EXPIRED},
            updated_at = NOW()
        WHERE id = ${id}
        AND status = ${InviteStatus.PENDING}
        RETURNING *
      `);

      const cancelledInvite = result.rows[0];

      // Invalidate cache
      await redisClient.del(`invite:${id}`);

      await client.query('COMMIT');

      // Log the cancellation
      logInviteCancelled(cancelled_by, UserRole.ADMIN, id, ip);

      return {
        success: true,
        invite: cancelledInvite
      };
    } catch (error) {
      await client.query('ROLLBACK');

      const finalError = error instanceof InviteError 
        ? error 
        : new InviteError(
            error instanceof Error ? error.message : 'Failed to cancel invite',
            'CANCEL_INVITE_FAILED',
            500
          );

      logInviteError(
        'INVITE_CANCELLATION_FAILED',
        cancelled_by,
        UserRole.ADMIN,
        finalError,
        { inviteId: id },
        ip
      );

      throw finalError;
    } finally {
      client.release();
    }
  }

  async cleanupExpiredInvites(): Promise<void> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Get expired invites
      const expiredInvites = await client.query(SQL`
        SELECT id FROM invites
        WHERE status = ${InviteStatus.PENDING}
        AND expiration_date < NOW()
        FOR UPDATE
      `);

      if (expiredInvites.rows.length > 0) {
        // Update status in batch
        await client.query(SQL`
          UPDATE invites
          SET status = ${InviteStatus.EXPIRED},
              updated_at = NOW()
          WHERE id = ANY(${expiredInvites.rows.map(row => row.id)})
        `);

        // Clear cache for expired invites
        for (const row of expiredInvites.rows) {
          await redisClient.del(`invite:${row.id}`);
        }

        logger.info(`Cleaned up ${expiredInvites.rows.length} expired invites`);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to cleanup expired invites:', error);
      throw new InviteError(error instanceof Error ? error.message : 'Failed to cleanup expired invites', 'CLEANUP_EXPIRED_INVITES_FAILED', 500);
    } finally {
      client.release();
    }
  }
}

export const inviteService = InviteService.getInstance();
