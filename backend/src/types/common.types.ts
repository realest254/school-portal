import { z } from 'zod';

// Branded types for IDs
export type UUID = string & { readonly __brand: unique symbol };
export type Email = string & { readonly __brand: unique symbol };
export type PhoneNumber = string & { readonly __brand: unique symbol };
export type EmployeeId = string & { readonly __brand: unique symbol };
export type TeacherName = string & { readonly __brand: unique symbol };
export type JoinDate = string & { readonly __brand: unique symbol };

// Common validation schemas
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const PhoneSchema = z.string().regex(/^\+?[\d\s-()]{10,}$/);
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}, { message: "Invalid date. Format: YYYY-MM-DD" });
export const EmployeeIdSchema = z.string().min(3).max(20);
export const TeacherNameSchema = z.string().min(2).max(100);
export const JoinDateSchema = DateSchema;

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

export function createEmployeeId(value: string): EmployeeId {
  EmployeeIdSchema.parse(value);
  return value as EmployeeId;
}

export function createTeacherName(value: string): TeacherName {
  TeacherNameSchema.parse(value);
  return value as TeacherName;
}

export function createJoinDate(value: string): JoinDate {
  JoinDateSchema.parse(value);
  return value as JoinDate;
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
  data: T | null;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
}

// Report Types
export interface ExamScore {
  subjectId: string;
  subjectName: string;
  score: number;
  grade: string;
}

export interface ExamReport {
  examId: string;
  examName: string;
  date: Date;
  scores: ExamScore[];
  totalMarks: number;
  average: number;
  rank: number;
  totalStudents: number;
}

export interface TermReport {
  term: number;
  year: number;
  exams: ExamReport[];
  termAverage: number;
  termRank: number;
  totalStudents: number;
  classAverage: number;
}

export interface YearReport {
  year: number;
  terms: TermReport[];
  yearAverage: number;
  yearRank: number;
  totalStudents: number;
  classAverage: number;
}

export interface ClassTermReport {
  term: number;
  year: number;
  classId: string;
  className: string;
  students: {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    termAverage: number;
    rank: number;
    exams: ExamReport[];
  }[];
  classAverage: number;
  totalStudents: number;
}

export interface ClassYearReport {
  year: number;
  classId: string;
  className: string;
  terms: {
    term: number;
    classAverage: number;
    students: {
      studentId: string;
      studentName: string;
      admissionNumber: string;
      termAverage: number;
      rank: number;
    }[];
  }[];
  yearAverage: number;
  totalStudents: number;
}

// Report Generation Request Types
export interface GenerateTermReportRequest {
  year: number;
  term: number;
  classId?: string; // Optional, if not provided generates for all classes
}

export interface GenerateYearReportRequest {
  year: number;
  classId?: string;
}
