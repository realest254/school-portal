import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { logError } from '../utils/logger';

export class TeacherController {
  static async getTeachers(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as string,
        subjectId: req.query.subjectId as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = await TeacherService.getTeachers(filters);
      res.json(result);
    } catch (error) {
      logError(error, 'TeacherController.getTeachers');
      res.status(500).json({ error: 'Failed to retrieve teachers' });
    }
  }

  static async getTeacherById(req: Request, res: Response) {
    try {
      const teacher = await TeacherService.getTeacherById(req.params.id);
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
      res.json(teacher);
    } catch (error) {
      logError(error, 'TeacherController.getTeacherById');
      res.status(500).json({ error: 'Failed to retrieve teacher' });
    }
  }

  static async createTeacher(req: Request, res: Response) {
    try {
      const teacher = await TeacherService.createTeacher({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        subjectIds: req.body.subjectIds,
        employeeId: req.body.employeeId,
        joinDate: req.body.joinDate
      });
      res.status(201).json(teacher);
    } catch (error) {
      logError(error, 'TeacherController.createTeacher');
      if (error instanceof Error) {
        if (error.message.includes('subject')) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: 'Failed to create teacher' });
    }
  }

  static async updateTeacher(req: Request, res: Response) {
    try {
      const teacher = await TeacherService.updateTeacher(req.params.id, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        subjectIds: req.body.subjectIds,
        employeeId: req.body.employeeId,
        joinDate: req.body.joinDate,
        status: req.body.status
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }

      res.json(teacher);
    } catch (error) {
      logError(error, 'TeacherController.updateTeacher');
      if (error instanceof Error) {
        if (error.message.includes('subject')) {
          return res.status(400).json({ error: error.message });
        }
      }
      res.status(500).json({ error: 'Failed to update teacher' });
    }
  }

  static async deleteTeacher(req: Request, res: Response) {
    try {
      const teacher = await TeacherService.deleteTeacher(req.params.id);
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
      res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
      logError(error, 'TeacherController.deleteTeacher');
      res.status(500).json({ error: 'Failed to delete teacher' });
    }
  }
}
