import { z } from 'zod';
import { encrypt, decrypt } from '../utils/encryption';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
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
  invited_by: z.string().uuid(),
  expiration_date: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
  accepted_at: z.date().nullable(),
  accepted_by: z.string().uuid().nullable()
});

export const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  invited_by: z.string().uuid(),
  expiration_date: z.date().optional()
});

export const BulkInviteSchema = z.object({
  invites: z.array(z.object({
    email: z.string().email(),
    role: z.nativeEnum(UserRole)
  })),
  invited_by: z.string().uuid(),
  expiration_date: z.date().optional()
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
  exp: number;
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
export function createInviteToken(tokenData: TokenData): InviteToken {
  const tokenString = JSON.stringify({
    id: tokenData.id,
    email: tokenData.email,
    role: tokenData.role,
    exp: tokenData.exp
  });
  const encryptedToken = encrypt(tokenString);
  return encryptedToken as InviteToken;
}

export function parseInviteToken(token: InviteToken): TokenData {
  const decryptedToken = decrypt(token as string);
  try {
    const data = JSON.parse(decryptedToken);
    if (!data.id || !data.email || !data.role || !data.exp) {
      throw new Error('Invalid token data structure');
    }
    return data as TokenData;
  } catch (error) {
    throw new InvalidTokenError('Invalid token format');
  }
}

export function stringToInviteToken(str: string): InviteToken {
  return str as InviteToken;
}

export function getTokenString(token: InviteToken): string {
  return token as string;
}
