import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { examService } from '../services/exam.service';
import { logError } from '../utils/logger';
import { ServiceError } from '../types/common.types';
import { 
    AuthenticatedRequest, 
    checkIsTeacherOrAdminOrError,
    checkIsAdminOrError
} from '../types/auth.types';

interface CreateExamData {
  name: string;
  term: number;
  year: number;
  classId: string;
}

export class ExamController {
  /**
   * Get all exams with optional filters
   */
  static async getAllExams(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsTeacherOrAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { term, year, status, classId } = req.query;
      
      const result = await examService.getExams({
        term: term ? Number(term) : undefined,
        year: year ? Number(year) : undefined,
        status: status === 'active' || status === 'archived' ? status : undefined,
        classId: classId as string
      });

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      logError('Error in getAllExams:', error);
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get exam by ID
   */
  static async getExamById(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsTeacherOrAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const exam = await examService.getExamById(req.params.id);
      if (!exam) {
        return res.status(404).json({
          success: false,
          error: 'Exam not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: exam
      });

    } catch (error) {
      logError('Error in getExamById:', error);
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Create new exam
   */
  static async createExam(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsTeacherOrAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const examData: CreateExamData = req.body;
      const exam = await examService.createExam(examData);

      return res.status(201).json({
        success: true,
        data: exam
      });

    } catch (error) {
      logError('Error in createExam:', error);
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update exam status
   */
  static async updateExamStatus(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsTeacherOrAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { status } = req.body;
      const exam = await examService.updateExamStatus(req.params.id, { status });

      return res.status(200).json({
        success: true,
        data: exam
      });

    } catch (error) {
      logError('Error in updateExamStatus:', error);
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Delete exam
   */
  static async deleteExam(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      await examService.deleteExam(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Exam deleted successfully'
      });

    } catch (error) {
      logError('Error in deleteExam:', error);
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get exam statistics
   */
  static async getExamStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsTeacherOrAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const stats = await examService.getExamStatistics(req.params.id);

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      logError('Error in getExamStatistics:', error);
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
