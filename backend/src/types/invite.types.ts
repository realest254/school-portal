import { z } from 'zod';
import { encrypt, decrypt } from '../utils/encryption';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired'
}

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export const InviteSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(InviteStatus),
  invited_by: z.string(),
  token: z.string().nullable(),
  expires_at: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
  accepted_at: z.date().nullable(),
  accepted_by: z.string().nullable()
});

export const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  invited_by: z.string()
});

export const BulkInviteSchema = z.object({
  invites: z.array(z.object({
    email: z.string().email(),
    role: z.nativeEnum(UserRole)
  })),
  invited_by: z.string()
});

export type Invite = z.infer<typeof InviteSchema>;
export type CreateInviteDto = z.infer<typeof CreateInviteSchema>;
export type BulkInviteDto = z.infer<typeof BulkInviteSchema>;

export class InviteError extends Error {
  constructor(
    message: string | undefined,
    public code: string,
    public status: number = 400
  ) {
    super(message || 'An error occurred with the invite');
    this.name = 'InviteError';
  }
}

export class InvalidTokenError extends InviteError {
  constructor(message: string = 'Invalid invite token') {
    super(message, 'INVALID_TOKEN', 400);
  }
}

export class ExpiredTokenError extends InviteError {
  constructor(message: string = 'Invite token has expired') {
    super(message, 'EXPIRED_TOKEN', 400);
  }
}

export class DomainError extends InviteError {
  constructor(message: string = 'Invalid email domain') {
    super(message, 'INVALID_DOMAIN', 400);
  }
}

export class RateLimitError extends InviteError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class SpamError extends InviteError {
  constructor(message: string = 'Too many invite attempts') {
    super(message, 'SPAM_DETECTED', 429);
  }
}

export interface TokenData {
  id: string;
  email: string;
  role: UserRole;
  exp: number; // Not used for expiration - we use database expires_at
}

export interface InviteResult {
  success: boolean;
  message?: string;
  invite?: Invite;
  error?: InviteError;
}

export interface BulkInviteResult {
  successful: Array<{
    email: string;
    role: UserRole;
    invite: Invite;
  }>;
  failed: Array<{
    email: string;
    role: UserRole;
    reason: string;
    error: InviteError;
  }>;
}

// Define InviteToken as a branded type
export type InviteToken = string & { readonly __brand: unique symbol };

// Add helper functions for type conversion
export function createInviteToken(data: TokenData): InviteToken {
  try {
    const tokenString = JSON.stringify(data);
    return encrypt(tokenString) as InviteToken;
  } catch (error) {
    throw new Error('Failed to create token');
  }
}

export function parseInviteToken(token: InviteToken): TokenData {
  try {
    const decryptedToken = decrypt(token as string);
    try {
      const data = JSON.parse(decryptedToken);
      
      // Validate token structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid token: Not a valid JSON object');
      }
      
      // Validate required fields
      if (!data.id || typeof data.id !== 'string') {
        throw new Error('Invalid token: Missing or invalid id');
      }
      if (!data.email || typeof data.email !== 'string') {
        throw new Error('Invalid token: Missing or invalid email');
      }
      if (!data.role || !Object.values(UserRole).includes(data.role)) {
        throw new Error('Invalid token: Missing or invalid role');
      }
      if (!data.exp || typeof data.exp !== 'number') {
        throw new Error('Invalid token: Missing or invalid expiration');
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        exp: data.exp
      };
    } catch (error) {
      throw new Error('Invalid token structure');
    }
  } catch (error) {
    throw new Error('Failed to decrypt token');
  }
}

export function stringToInviteToken(str: string): InviteToken {
  return str as InviteToken;
}

export function getTokenString(token: InviteToken): string {
  return token as string;
}
