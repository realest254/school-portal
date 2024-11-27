import { Pool, PoolClient } from 'pg';
import SQL from 'sql-template-strings';
import pool from '../db';
import { supabase } from '../config/supabase';
import { encrypt, decrypt } from '../utils/encryption';
import { redisClient } from '../config/redis';
import { RateLimiter } from '../utils/rate-limiter';
import logger, { logError } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
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
  RateLimitError,
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
  private readonly INVITE_EXPIRY_DAYS = 7; // 7 days
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
      exp: Math.floor(Date.now() / 1000) + (this.INVITE_EXPIRY_DAYS * 24 * 60 * 60)
    };
    return createInviteToken(tokenData);
  }

  async createInvite(data: CreateInviteDto, ip?: string): Promise<InviteResult> {
    const client = await this.db.connect();

    try {
      // Basic input validation
      if (!data.email?.trim()) {
        throw new InviteError('Email is required', 'INVALID_EMAIL', 400);
      }
      if (!data.invited_by?.trim()) {
        throw new InviteError('Invited by is required', 'INVALID_INVITED_BY', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new InviteError('Invalid email format', 'INVALID_EMAIL_FORMAT', 400);
      }

      await client.query('BEGIN');

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

      // Set expiration to 7 days from now
      const now = new Date();
      const expires_at = new Date(now.getTime() + (this.INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

      // Create invite
      const result = await client.query(SQL`
        INSERT INTO invites (
          email, role, status, invited_by, expires_at
        ) VALUES (
          ${data.email}, ${data.role}, ${InviteStatus.PENDING}, ${data.invited_by}, ${expires_at}
        ) RETURNING *
        FOR UPDATE
      `);

      const invite = result.rows[0];

      // Generate token
      const token = this.generateToken({
        id: invite.id,
        email: invite.email,
        role: invite.role
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

      return {
        success: true,
        invite
      };

    } catch (error) {
      await client.query('ROLLBACK');

      // Preserve specific error types
      if (error instanceof DomainError || error instanceof SpamError || error instanceof RateLimitError) {
        throw error;
      }

      // Wrap unknown errors
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

      // Set expiration to 7 days from now for all invites
      const now = new Date();
      const expires_at = new Date(now.getTime() + (this.INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

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

          const createdInvite = await client.query(SQL`
            INSERT INTO invites (
              email, role, status, invited_by, expires_at
            ) VALUES (
              ${invite.email}, ${invite.role}, ${InviteStatus.PENDING}, ${data.invited_by}, ${expires_at}
            ) RETURNING *
            FOR UPDATE
          `);

          const inviteResult = createdInvite.rows[0];

          // Generate token with expiry
          const token = this.generateToken({
            id: inviteResult.id,
            email: invite.email,
            role: invite.role
          });

          // Send invite email with retry logic
          const emailResult = await this.sendInviteEmail(inviteResult, token);
          if (!emailResult.success) {
            const errorMessage = emailResult.error || 'Failed to send invite email';
            throw new InviteError(errorMessage, 'SEND_INVITE_EMAIL_FAILED', 500);
          }

          // Cache the invite
          await redisClient.set(`invite:${inviteResult.id}`, inviteResult, this.INVITE_CACHE_TTL);

          successful.push({
            email: invite.email,
            role: invite.role,
            invite: inviteResult
          });

          // Log successful creation
          logInviteCreated(
            data.invited_by,
            invite.role,
            inviteResult.id,
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
            expiresIn: `${this.INVITE_EXPIRY_DAYS} days`,
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

  // Reusable transaction wrapper
  private async withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reusable cache checker for invites
  private async getInviteFromCache(id: string): Promise<Invite | null> {
    const cached = await redisClient.get<Invite>(`invite:${id}`);
    if (cached) {
      await redisClient.set(`invite:${id}`, cached, this.INVITE_CACHE_TTL);
      return cached;
    }
    return null;
  }

  // Reusable invite status validator
  private validateInviteStatus(invite: Invite): { valid: boolean; message?: string } {
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);

    if (invite.status !== InviteStatus.PENDING) {
      return {
        valid: false,
        message: 'Invite is no longer valid'
      };
    }

    if (expiresAt < now) {
      return {
        valid: false,
        message: 'Invite has expired'
      };
    }

    return { valid: true };
  }

  async getById(id: string): Promise<Invite | null> {
    try {
      // Try to get from cache first
      const cached = await this.getInviteFromCache(id);
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

  async checkInviteValidity(id: string): Promise<{ valid: boolean; message?: string; invite?: Invite }> {
    try {
      // Try cache first
      const cached = await this.getInviteFromCache(id);
      if (cached) {
        const validationResult = this.validateInviteStatus(cached);
        return {
          ...validationResult,
          invite: validationResult.valid ? cached : undefined
        };
      }

      // Query database
      const result = await this.db.query(SQL`
        SELECT * FROM invites
        WHERE id = ${id}
        AND status = ${InviteStatus.PENDING}
        FOR UPDATE
      `);

      if (result.rows.length === 0) {
        return {
          valid: false,
          message: 'Invite not found or already used'
        };
      }

      const invite = result.rows[0];
      const validationResult = this.validateInviteStatus(invite);
      
      return {
        ...validationResult,
        invite: validationResult.valid ? invite : undefined
      };

    } catch (error) {
      logError(error, 'checkInviteValidity');
      throw new InviteError(
        error instanceof Error ? error.message : 'Failed to check invite validity',
        'CHECK_INVITE_FAILED',
        500
      );
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

  async acceptInvite(data: { id: string; email: string; role: UserRole }, acceptedBy: string): Promise<InviteResult> {
    return this.withTransaction(async (client) => {
      const invite = await this.getById(data.id);
      if (!invite) {
        throw new InviteError('Invite not found', 'INVITE_NOT_FOUND', 404);
      }

      const validationResult = this.validateInviteStatus(invite);
      if (!validationResult.valid) {
        throw new InviteError(validationResult.message || 'Invalid invite', 'INVALID_INVITE', 400);
      }

      // Update invite status
      const result = await client.query(SQL`
        UPDATE invites 
        SET status = ${InviteStatus.ACCEPTED}, 
            accepted_at = NOW(),
            accepted_by = ${acceptedBy}
        WHERE id = ${data.id} 
        RETURNING *
      `);

      const acceptedInvite = result.rows[0];

      // Invalidate cache
      await redisClient.del(`invite:${data.id}`);

      // Log the acceptance
      logInviteAccepted(acceptedBy, UserRole.STUDENT, data.id);

      return {
        success: true,
        invite: acceptedInvite
      };
    });
  }

  async decryptAndValidateToken(token: InviteToken): Promise<{
    valid: boolean;
    message?: string;
    invite?: {
      id: string;
      email: string;
      role: UserRole;
      status: InviteStatus;
      expires_at: Date;
    };
  }> {
    try {
      const inviteToken = stringToInviteToken(token);
      const tokenData = parseInviteToken(inviteToken);

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (tokenData.exp <= now) {
        return {
          valid: false,
          message: 'Token has expired'
        };
      }

      // Get invite from database
      const result = await this.db.query(SQL`
        SELECT id, email, role, status, expires_at
        FROM invites
        WHERE id = ${tokenData.id}
        AND status = ${InviteStatus.PENDING}
      `);

      if (result.rows.length === 0) {
        return {
          valid: false,
          message: 'Invite not found or already used'
        };
      }

      const invite = result.rows[0];
      const expiresAt = new Date(invite.expires_at);

      if (expiresAt < new Date()) {
        return {
          valid: false,
          message: 'Invite has expired'
        };
      }

      return {
        valid: true,
        invite
      };

    } catch (error) {
      logError(error, 'decryptAndValidateToken');
      if (error instanceof InvalidTokenError) {
        return {
          valid: false,
          message: 'Invalid token'
        };
      }
      throw error;
    }
  }

  async validateInvite(token: string, clientIp: string): Promise<{ valid: boolean; message?: string; invite?: Invite }> {
    const client = await this.db.connect();
    try {
      // Check rate limiting
      await RateLimiter.checkIpLimit(clientIp);

      // First check cache
      const cacheKey = `invite:validate:${token}`;
      const cachedResult = await redisClient.get<{ valid: boolean; message?: string; invite?: Invite }>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Decrypt and validate token
      const inviteToken = stringToInviteToken(token);
      const tokenData = await this.decryptAndValidateToken(inviteToken);

      if (!tokenData.valid || !tokenData.invite) {
        return { valid: false, message: tokenData.message };
      }

      // Get invite details and check validity
      const invite = await this.getById(tokenData.invite.id);
      if (!invite) {
        return { valid: false, message: 'Invite not found' };
      }

      if (invite.status !== InviteStatus.PENDING) {
        return { valid: false, message: 'Invite is no longer valid' };
      }

      const now = new Date();
      const expiresAt = new Date(invite.expires_at);
      if (expiresAt < now) {
        return { valid: false, message: 'Invite has expired' };
      }

      const result = { valid: true, invite };

      // Cache the validation result
      await redisClient.set(cacheKey, JSON.stringify(result), this.INVITE_CACHE_TTL);

      await client.query('COMMIT');
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

}

export const inviteService = InviteService.getInstance();
