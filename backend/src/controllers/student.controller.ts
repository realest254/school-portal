import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { studentService } from '../services/student.service';
import { teacherService } from '../services/teacher.service'; // Added import statement
import { logError } from '../utils/logger';
import { UserRole } from '../middlewares/auth.middleware';
import { ServiceError } from '../types/common.types';
import { 
    AuthenticatedRequest, 
    checkIsAdminOrError, 
    checkIsSameUserOrAdmin, 
    handleAuthError 
} from '../types/auth.types';

interface CreateStudentData {
  name: string;
  studentId: string;
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
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { status, class: classFilter, search, page, limit } = req.query;
      
      const result = await studentService.getStudents({
        status: status === 'active' || status === 'inactive' ? status : undefined,
        class: classFilter as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching students:', errorMessage);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch students' 
      });
    }
  }

  /**
   * Get a student by identifier (admission number or email)
   * Access rules:
   * - Admins can look up any student using email or admission number
   * - Students can only look up:
   *   1. Their own data using their email
   *   2. Their own data using their admission number
   * - Teachers should use getStudentsByClass endpoint
   */
  static async getStudentByIdentifier(req: AuthenticatedRequest, res: Response) {
    try {
      const { identifier } = req.params;
      const { user } = req;

      // Teachers cannot access student data directly
      if (user.role === UserRole.TEACHER) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Teachers should access student data through class endpoints.'
        });
      }

      let searchParams = {};

      // Check if identifier is an email
      if (identifier.includes('@')) {
        searchParams = { email: identifier };
      }
      // Otherwise treat as admission number
      else {
        searchParams = { admissionNumber: identifier };
      }

      // For students, verify it's their own data
      if (user.role === UserRole.STUDENT) {
        const studentData = await studentService.getStudentByIdentifier({ email: user.email });
        
        if (!studentData.data) {
          return res.status(404).json({
            success: false,
            error: 'Student data not found'
          });
        }
        
        // Check if requested identifier matches their own data
        if (identifier !== studentData.data.email && identifier !== studentData.data.studentId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only view your own data.'
          });
        }
      }

      const result = await studentService.getStudentByIdentifier(searchParams);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({ 
          success: false,
          error: error.message 
        });
      }
      logError(error, 'Error fetching student');
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch student' 
      });
    }
  }

  /**
   * Create a new student
   */
  static async createStudent(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { name, admissionNumber, email, class: className, parentPhone, dob } = req.body;
      
      const studentData: CreateStudentData = {
        name,
        studentId: admissionNumber, // Using admissionNumber as studentId
        admissionNumber,
        email,
        class: className,
        parentPhone,
        dob
      };
      
      const student = await studentService.createStudent(studentData);

      return res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating student:', errorMessage);
      if (error instanceof ServiceError && error.message === 'Email already registered') {
        return res.status(400).json({ 
          success: false,
          error: error.message 
        });
      }
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create student' 
      });
    }
  }

  /**
   * Update student details
   */
  static async updateStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      checkIsAdminOrError(req.user);

      const student = await studentService.updateStudent(id, req.body);

      if (!student) {
        return res.status(404).json({ 
          success: false,
          error: 'Student not found' 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error updating student:', errorMessage);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update student' 
      });
    }
  }

  /**
   * Delete a student
   */
  static async deleteStudent(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      checkIsAdminOrError(req.user);

      await studentService.deleteStudent(id);

      return res.status(204).send();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error deleting student:', errorMessage);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete student' 
      });
    }
  }

  /**
   * Get students by class with pagination and filters
   */
  static async getStudentsByClass(req: AuthenticatedRequest, res: Response) {
    try {
      const { class: className } = req.params;
      const { user } = req;
      const { page, limit, status, search } = req.query;

      // Only admins and teachers can access this endpoint
      if (user.role === UserRole.STUDENT) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Students cannot access this endpoint.'
        });
      }

      // Teachers can only view their assigned classes
      if (user.role === UserRole.TEACHER) {
        const hasAccess = await teacherService.isTeacherAssignedToClass(user.email, className);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only view your assigned classes.'
          });
        }
      }

      const filters = {
        class: className,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as 'active' | 'inactive' | undefined,
        search: search as string | undefined
      };

      const result = await studentService.getStudents(filters);

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: unknown) {
      logError(error, 'StudentController.getStudentsByClass');

      if (error instanceof ServiceError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to get students'
      });
    }
  }
}
