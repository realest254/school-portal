import { Request, Response } from 'express';
import { logError, logInfo } from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/adminAuth.middleware';
import { validationResult } from 'express-validator';
import { TeacherService } from '../services/teacher.service';

export class TeacherController {
  /**
   * Get all teachers with optional filters
   */
  static async getAllTeachers(req: Request, res: Response) {
    try {
      const { status, subject, search, page = 1, limit = 10 } = req.query;

      const teachers = await TeacherService.getTeachers({
        status: status as string,
        subject: subject as string,
        search: search as string,
        page: Number(page),
        limit: Number(limit)
      });

      logInfo('Teachers fetched successfully', { count: teachers.total });

      return res.status(200).json(teachers);
    } catch (error) {
      logError(error, 'getAllTeachers');
      return res.status(500).json({ error: 'Failed to fetch teachers' });
    }
  }

  /**
   * Get teacher by ID
   */
  static async getTeacherById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacher = await TeacherService.getTeacherById(id);

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      return res.status(200).json(teacher);
    } catch (error) {
      logError(error, 'getTeacherById');
      return res.status(500).json({ error: 'Failed to fetch teacher' });
    }
  }

  /**
   * Create a new teacher
   */
  static async createTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, employeeId, email, subject, phone, joinDate } = req.body;

      const teacher = await TeacherService.createTeacher({
        name,
        employeeId,
        email,
        subject,
        phone,
        joinDate
      });

      logInfo('Teacher created successfully', { teacherId: teacher.id });

      return res.status(201).json({
        message: 'Teacher created successfully',
        teacher
      });
    } catch (error) {
      logError(error, 'createTeacher');
      if (error.message.includes('already exists')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to create teacher' });
    }
  }

  /**
   * Update teacher details
   */
  static async updateTeacher(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, employeeId, email, subject, phone, joinDate, status } = req.body;

      const teacher = await TeacherService.updateTeacher(id, {
        name,
        employeeId,
        email,
        subject,
        phone,
        joinDate,
        status
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      logInfo('Teacher updated successfully', { teacherId: id });

      return res.status(200).json({
        message: 'Teacher updated successfully',
        teacher
      });
    } catch (error) {
      logError(error, 'updateTeacher');
      if (error.message.includes('already exists')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to update teacher' });
    }
  }

  /**
   * Delete a teacher
   */
  static async deleteTeacher(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const teacher = await TeacherService.deleteTeacher(id);

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      logInfo('Teacher deleted successfully', { teacherId: id });

      return res.status(200).json({
        message: 'Teacher deleted successfully'
      });
    } catch (error) {
      logError(error, 'deleteTeacher');
      return res.status(500).json({ error: 'Failed to delete teacher' });
    }
  }
}
