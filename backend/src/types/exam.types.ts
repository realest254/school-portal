import { ServiceError } from './common.types';

export interface Exam {
  id: string;
  name: string;
  term: number;
  year: number;
  classId: string;
  className?: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamQuery {
  term?: number;
  year?: number;
  status?: 'active' | 'archived';
  classId?: string;
}

export interface ExamStats {
  studentsCount: number;
  subjectsCount: number;
  averageScore: number;
}

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  totalGrades: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  passingCount: number;
  passRate: number;
}

export interface CreateExamDTO {
  name: string;
  term: number;
  year: number;
  classId: string;
}

export interface UpdateExamDTO {
  status: 'active' | 'archived';
}
