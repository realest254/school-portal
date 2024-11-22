import { Request, Response } from 'express';
import { teacherService, TeacherNotFoundError, DuplicateTeacherError } from '../services/teacher.service';
import { logError } from '../utils/logger';
import { UserRole } from '../middlewares/auth.middleware';

// Use the built-in Express Request type augmentation
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
};

export class TeacherController {
  private static instance: TeacherController;
  private constructor() {}

  static getInstance(): TeacherController {
    if (!TeacherController.instance) {
      TeacherController.instance = new TeacherController();
    }
    return TeacherController.instance;
  }

  async getTeachers(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as 'active' | 'inactive' | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const result = await teacherService.getTeachers(filters);
      res.json(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('TeacherController.getTeachers:', errorMessage);
      res.status(500).json({ error: 'Failed to retrieve teachers' });
    }
  }

  async getTeacherByIdentifier(req: Request, res: Response) {
    try {
      const identifier = {
        id: req.params.id,
        employeeId: req.query.employeeId as string,
        email: req.query.email as string,
        name: req.query.name as string
      };

      const result = await teacherService.getTeacherByIdentifier(identifier);
      res.json(result.data);
    } catch (error: unknown) {
      if (error instanceof TeacherNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('TeacherController.getTeacherByIdentifier:', errorMessage);
      res.status(500).json({ error: 'Failed to retrieve teacher' });
    }
  }

  async createTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const result = await teacherService.createTeacher({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        subjectIds: req.body.subjectIds,
        employeeId: req.body.employeeId,
        joinDate: req.body.joinDate
      });

      res.status(201).json(result.data);
    } catch (error: unknown) {
      if (error instanceof DuplicateTeacherError) {
        return res.status(409).json({ error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('TeacherController.createTeacher:', errorMessage);
      res.status(500).json({ error: 'Failed to create teacher' });
    }
  }

  async updateTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const result = await teacherService.updateTeacher(req.params.id, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        subjectIds: req.body.subjectIds,
        employeeId: req.body.employeeId,
        joinDate: req.body.joinDate,
        status: req.body.status
      });

      res.json(result.data);
    } catch (error: unknown) {
      if (error instanceof TeacherNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof DuplicateTeacherError) {
        return res.status(409).json({ error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('TeacherController.updateTeacher:', errorMessage);
      res.status(500).json({ error: 'Failed to update teacher' });
    }
  }

  async deleteTeacher(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      await teacherService.deleteTeacher(req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof TeacherNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('TeacherController.deleteTeacher:', errorMessage);
      res.status(500).json({ error: 'Failed to delete teacher' });
    }
  }
}

export const teacherController = TeacherController.getInstance();
