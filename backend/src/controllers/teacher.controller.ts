import { Request, Response } from 'express';
import { teacherService } from '../services/teacher.service';
import { logError } from '../utils/logger';
import { UserRole } from '../middlewares/auth.middleware';
import { ServiceError } from '../types/common.types';
import { 
    AuthenticatedRequest, 
    checkIsAdminOrError, 
    checkIsSameUserOrAdmin, 
    handleAuthError 
} from '../types/auth.types';
import { validationResult } from 'express-validator';

interface CreateTeacherData {
  name: string;
  employeeId: string;
  email: string;
  subjects: string[];
  phone: string;
  joinDate: string;
  class?: string;
}

export class TeacherController {
  /**
   * Get all teachers with optional filters
   */
  static async getAllTeachers(req: AuthenticatedRequest, res: Response) {
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
      
      const result = await teacherService.getTeachers({
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
      logError(error, 'Error fetching teachers');
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch teachers' 
      });
    }
  }

  /**
   * Get a teacher by identifier (employee id or email)
   * Access rules:
   * - Admins can look up any teacher using email or employee ID
   * - Teachers can only look up:
   *   1. Their own data using their email
   *   2. Their own data using their employee ID
   * - Students cannot access teacher data
   */
  static async getTeacherByIdentifier(req: AuthenticatedRequest, res: Response) {
    try {
      const { identifier } = req.params;
      const { user } = req;

      // Students cannot access teacher data directly
      if (user.role === UserRole.STUDENT) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Students cannot access teacher data.'
        });
      }

      let searchParams = {};

      // Check if identifier is an email
      if (identifier.includes('@')) {
        searchParams = { email: identifier };
      }
      // Otherwise treat as employee id
      else {
        searchParams = { employeeId: identifier };
      }

      // For teachers, first verify it's their own data by looking up the teacher
      if (user.role === UserRole.TEACHER) {
        const teacherData = await teacherService.getTeacherByIdentifier({ email: user.email });
        
        if (!teacherData.data) {
          return res.status(404).json({
            success: false,
            error: 'Teacher data not found'
          });
        }
        
        // Check if requested identifier matches their own data
        if (identifier !== teacherData.data.email && identifier !== teacherData.data.employeeId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only view your own data.'
          });
        }
      }

      const result = await teacherService.getTeacherByIdentifier(searchParams);
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
      logError(error, 'Error fetching teacher');
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch teacher' 
      });
    }
  }

  /**
   * Create a new teacher
   */
  static async createTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const teacherData: CreateTeacherData = req.body;
      const result = await teacherService.createTeacher(teacherData);

      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({ 
          success: false,
          error: error.message 
        });
      }
      logError(error, 'Error creating teacher');
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create teacher' 
      });
    }
  }

  /**
   * Update teacher details
   */
  static async updateTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;

      // Check if user has permission to update this teacher
      checkIsSameUserOrAdmin(user, id);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const result = await teacherService.updateTeacher(id, req.body);

      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({ 
          success: false,
          error: error.message 
        });
      }
      logError(error, 'Error updating teacher');
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update teacher' 
      });
    }
  }

  /**
   * Delete a teacher
   */
  static async deleteTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const { id } = req.params;
      await teacherService.deleteTeacher(id);

      return res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully'
      });
    } catch (error: unknown) {
      if (error instanceof ServiceError) {
        return res.status(error.status).json({ 
          success: false,
          error: error.message 
        });
      }
      logError(error, 'Error deleting teacher');
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete teacher' 
      });
    }
  }
}

export const teacherController = TeacherController;
