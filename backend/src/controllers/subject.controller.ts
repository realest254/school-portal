import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { SubjectService } from '../services/subject.service';
import { UserRole } from '../middlewares/auth.middleware';
import { logError } from '../utils/logger';
import { AuthenticatedRequest, checkIsAdminOrError } from '../types/auth.types';

const subjectService = new SubjectService();

export class SubjectController {
  /**
   * Create a new subject
   * Access: Admin only
   */
  static async createSubject(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const subject = await subjectService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'SubjectController.createSubject');
      return res.status(500).json({
        success: false,
        error: 'Failed to create subject'
      });
    }
  }

  /**
   * Update a subject
   * Access: Admin only
   */
  static async updateSubject(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const subject = await subjectService.update(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: subject
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'SubjectController.updateSubject');
      return res.status(500).json({
        success: false,
        error: 'Failed to update subject'
      });
    }
  }

  /**
   * Get all subjects
   * Access: All authenticated users
   */
  static async getAllSubjects(req: AuthenticatedRequest, res: Response) {
    try {
      const subjects = await subjectService.getAll();
      return res.status(200).json({
        success: true,
        data: subjects
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'SubjectController.getAllSubjects');
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subjects'
      });
    }
  }

  /**
   * Get a subject by ID
   * Access: All authenticated users
   */
  static async getSubjectById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const subject = await subjectService.getById(id);
      
      if (!subject) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: subject
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'SubjectController.getSubjectById');
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subject'
      });
    }
  }

  /**
   * Delete a subject
   * Access: Admin only
   */
  static async deleteSubject(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const { id } = req.params;
      await subjectService.delete(id);
      
      return res.status(200).json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'SubjectController.deleteSubject');
      return res.status(500).json({
        success: false,
        error: 'Failed to delete subject'
      });
    }
  }

  /**
   * Search subjects
   * Access: All authenticated users
   */
  static async searchSubjects(req: AuthenticatedRequest, res: Response) {
    try {
      const { term } = req.query;
      
      if (typeof term !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Search term must be a string'
        });
      }

      const subjects = await subjectService.search(term);
      return res.status(200).json({
        success: true,
        data: subjects
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'SubjectController.searchSubjects');
      return res.status(500).json({
        success: false,
        error: 'Failed to search subjects'
      });
    }
  }
}
