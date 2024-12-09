import { Request, Response } from 'express';
import { gradeService } from '../services/grade.service';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../types/auth.types';
import { ServiceError } from '../types/common.types';
import { BulkGradeSchema } from '../types/grade.types';

export class GradeController {
  /**
   * Create a single grade
   * Access: Teachers only
   */
  static async createGrade(req: AuthenticatedRequest, res: Response) {
    try {
      // Transform single grade into bulk format
      const validatedData = BulkGradeSchema.parse({
        examId: req.body.examId,
        grades: [{
          studentId: req.body.studentId,
          subjectScores: req.body.subjectScores
        }]
      });

      const result = await gradeService.createBulkGrades(validatedData);
      
      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create grade',
          code: 'CREATE_ERROR'
        });
      }

      res.status(201).json({
        success: true,
        data: {
          gradesSubmitted: result.data.gradesSubmitted
        }
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        res.status(error.status).json({ 
          success: false, 
          error: error.message,
          code: error.code 
        });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'GradeController.createGrade');
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Create bulk grades
   * Access: Teachers only
   */
  static async createGrades(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = BulkGradeSchema.parse(req.body);

      const result = await gradeService.createBulkGrades(validatedData);
      
      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create grades',
          code: 'CREATE_ERROR'
        });
      }

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ServiceError) {
        res.status(error.status).json({ 
          success: false, 
          error: error.message,
          code: error.code 
        });
        return;
      }
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get student grades by filter
   * Access: Teachers and Parents
   */
  static async getStudentGradesByFilter(req: Request, res: Response) {
    try {
      const filters = {
        admissionNumber: req.query.admissionNumber as string,
        studentName: req.query.studentName as string,
        classId: req.query.classId as string,
        examId: req.query.examId as string
      };

      const result = await gradeService.getStudentGradesByFilter(filters);
      
      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch grades',
          code: 'FETCH_ERROR'
        });
      }

      res.json(result);
    } catch (error) {
      if (error instanceof ServiceError) {
        res.status(error.status).json({ 
          success: false, 
          error: error.message,
          code: error.code 
        });
        return;
      }
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

export default GradeController;
