import { Request, Response } from 'express';
import { indisciplineService } from '../services/indiscipline.service';
import { teacherService } from '../services/teacher.service';
import { studentService } from '../services/student.service';
import { logError } from '../utils/logger';
import { UserRole } from '../middlewares/auth.middleware';
import { ServiceResult } from '../types/common.types';
import { AuthenticatedRequest } from '../types/auth.types';
import { IndisciplineRecord, IndisciplineFilters } from '../services/indiscipline.service';

export class IndisciplineController {
  /**
   * Create a new indiscipline record
   * Access rules:
   * - Admins can create records for any student
   * - Teachers can only create records for students in their classes
   * - Students cannot create records
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { studentId } = req.body;

      // Students cannot create indiscipline records
      if (user.role === UserRole.STUDENT) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Students cannot create indiscipline records.'
        });
      }

      // For teachers, verify they can access this student
      if (user.role === UserRole.TEACHER) {
        const student = await studentService.getStudentByIdentifier({ id: studentId });
        if (!student.data) {
          return res.status(404).json({
            success: false,
            error: 'Student not found'
          });
        }

        const hasAccess = await teacherService.isTeacherAssignedToClass(user.email, student.data.class);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only create records for students in your classes.'
          });
        }
      }

      const result = await indisciplineService.create({
        ...req.body,
        createdBy: user.email
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to create indiscipline record'
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error: unknown) {
      logError(error, 'IndisciplineController.create');
      return res.status(500).json({
        success: false,
        error: 'Failed to create indiscipline record'
      });
    }
  }

  /**
   * Update an indiscipline record
   * Access rules:
   * - Admins can update any record
   * - Teachers can only update records they created for their students
   * - Students cannot update records
   */
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { user } = req;

      // Students cannot update records
      if (user.role === UserRole.STUDENT) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Students cannot update indiscipline records.'
        });
      }

      // Get the existing record
      const existingRecord = await indisciplineService.getById(id);
      if (!existingRecord.success || !existingRecord.data) {
        return res.status(404).json({
          success: false,
          error: 'Indiscipline record not found'
        });
      }

      // For teachers, verify they created the record and still have access to the student
      if (user.role === UserRole.TEACHER) {
        if (existingRecord.data.createdBy !== user.email) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. You can only update records you created.'
          });
        }

        const student = await studentService.getStudentByIdentifier({ id: existingRecord.data.studentId });
        if (!student.data) {
          return res.status(404).json({
            success: false,
            error: 'Student not found'
          });
        }

        const hasAccess = await teacherService.isTeacherAssignedToClass(user.email, student.data.class);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Student is no longer in your class.'
          });
        }
      }

      const result = await indisciplineService.update(id, req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to update indiscipline record'
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error: unknown) {
      logError(error, 'IndisciplineController.update');
      return res.status(500).json({
        success: false,
        error: 'Failed to update indiscipline record'
      });
    }
  }

  /**
   * Delete an indiscipline record
   * Access rules:
   * - Only admins can delete records
   */
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;

      // Only admins can delete records
      if (user.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only administrators can delete indiscipline records.'
        });
      }

      const { id } = req.params;
      const result = await indisciplineService.delete(id);
      
      if (!result.success) {
        // Since we're using string errors now, we'll check the error message
        if (result.error?.includes('not found')) {
          return res.status(404).json({
            success: false,
            error: result.error
          });
        }
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to delete indiscipline record'
        });
      }

      return res.status(204).send();
    } catch (error: unknown) {
      logError(error, 'IndisciplineController.delete');
      return res.status(500).json({
        success: false,
        error: 'Failed to delete indiscipline record'
      });
    }
  }

  /**
   * Get all indiscipline records with filters
   * Access rules:
   * - Admins can view all records
   * - Teachers can only view records for their current students
   * - Students can only view their own records
   */
  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const filters: IndisciplineFilters = req.query;

      // If user is a student, they can only view their own records
      if (user.role === UserRole.STUDENT) {
        filters.forStudent = user.id;
      }

      // If user is a teacher, they can only view records for their current students
      if (user.role === UserRole.TEACHER) {
        filters.teacherEmail = user.email;
      }

      const results = await indisciplineService.getAll(filters);
      
      if (!results.success) {
        return res.status(400).json({
          success: false,
          error: results.error || 'Failed to get indiscipline records'
        });
      }

      return res.status(200).json({
        success: true,
        data: results.data
      });
    } catch (error: unknown) {
      logError(error, 'IndisciplineController.getAll');
      return res.status(500).json({
        success: false,
        error: 'Failed to get indiscipline records'
      });
    }
  }

  /**
   * Get indiscipline records for a specific student
   * Access rules:
   * - Admins can view any student's records
   * - Teachers can only view records for their current students
   * - Students can only view their own records
   */
  static async getByStudentId(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const { user } = req;

      // For students, verify they're accessing their own records
      if (user.role === UserRole.STUDENT && user.id !== studentId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only view your own records.'
        });
      }

      // For teachers, verify they have access to the student
      if (user.role === UserRole.TEACHER) {
        const student = await studentService.getStudentByIdentifier({ id: studentId });
        if (!student.data) {
          return res.status(404).json({
            success: false,
            error: 'Student not found'
          });
        }

        const hasAccess = await teacherService.isTeacherAssignedToClass(user.email, student.data.class);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Student is not in your class.'
          });
        }
      }

      const results = await indisciplineService.getByStudentId(studentId);
      
      if (!results.success) {
        return res.status(400).json({
          success: false,
          error: results.error || 'Failed to get student indiscipline records'
        });
      }

      return res.status(200).json({
        success: true,
        data: results.data
      });
    } catch (error: unknown) {
      logError(error, 'IndisciplineController.getByStudentId');
      return res.status(500).json({
        success: false,
        error: 'Failed to get student indiscipline records'
      });
    }
  }
}
