import { z } from 'zod';

// Branded types for IDs
export type UUID = string & { readonly __brand: unique symbol };
export type Email = string & { readonly __brand: unique symbol };
export type PhoneNumber = string & { readonly __brand: unique symbol };

// Common validation schemas
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[\d\s-()]{10,}$/);
export const DateSchema = z.string().datetime();

// Type guards and converters
export function isUUID(value: string): value is UUID {
  try {
    UUIDSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function createUUID(value: string): UUID {
  UUIDSchema.parse(value);
  return value as UUID;
}

export function createEmail(value: string): Email {
  EmailSchema.parse(value);
  return value as Email;
}

export function createPhoneNumber(value: string): PhoneNumber {
  PhoneSchema.parse(value);
  return value as PhoneNumber;
}

// Base error class
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Common response types
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
