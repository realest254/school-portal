import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { studentService } from '../services/student.service';
import { logError } from '../utils/logger';
import { UserRole } from '../middlewares/auth.middleware';
import { ServiceError } from '../types/common.types';

// Use the built-in Express Request type augmentation
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
};

interface CreateStudentData {
  name: string;
  admissionNumber: string;
  email: string;
  class: string;
  parentPhone: string;
  dob: string;
}

export class StudentController {
  /**
   * Get all students with optional filters
   */
  static async getAllStudents(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, class: classFilter, search, page, limit } = req.query;
      
      const result = await studentService.getStudents({
        status: status === 'active' || status === 'inactive' ? status : undefined,
        class: classFilter as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      return res.status(200).json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching students:', errorMessage);
      return res.status(500).json({ error: 'Failed to fetch students' });
    }
  }

  /**
   * Get a student by ID
   */
  static async getStudentById(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const student = await studentService.getStudentById(id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.status(200).json(student);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching student:', errorMessage);
      return res.status(500).json({ error: 'Failed to fetch student' });
    }
  }

  /**
   * Create a new student
   */
  static async createStudent(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const studentData: CreateStudentData = req.body;
      
      const student = await studentService.createStudent(studentData);

      return res.status(201).json({
        message: 'Student created successfully',
        student
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating student:', errorMessage);
      if (error instanceof ServiceError && error.message === 'Email already registered') {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to create student' });
    }
  }

  /**
   * Update student details
   */
  static async updateStudent(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const updateData = req.body;

      const student = await studentService.updateStudent(id, updateData);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.status(200).json({
        message: 'Student updated successfully',
        student
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error updating student:', errorMessage);
      return res.status(500).json({ error: 'Failed to update student' });
    }
  }

  /**
   * Delete a student
   */
  static async deleteStudent(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      await studentService.deleteStudent(id);

      return res.status(200).json({
        message: 'Student deleted successfully'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error deleting student:', errorMessage);
      return res.status(500).json({ error: 'Failed to delete student' });
    }
  }
}
