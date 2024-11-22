import { Request, Response } from 'express';
import { SubjectService } from '../services/subject.service';
import { UserRole } from '../middlewares/auth.middleware';
import { logError } from '../utils/logger';

// Use the built-in Express Request type augmentation
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role: UserRole;
    email: string;
  };
};

export class SubjectController {
  private subjectService: SubjectService;

  constructor() {
    this.subjectService = new SubjectService();
  }

  async createSubject(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const subject = await this.subjectService.create(req.body);
      res.status(201).json(subject);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error creating subject:', errorMessage);
      res.status(400).json({ error: errorMessage });
    }
  }

  async updateSubject(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const subject = await this.subjectService.update(id, req.body);
      res.json(subject);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error updating subject:', errorMessage);
      res.status(400).json({ error: errorMessage });
    }
  }

  async deleteSubject(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      await this.subjectService.delete(id);
      res.json({ message: 'Subject deleted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error deleting subject:', errorMessage);
      res.status(400).json({ error: errorMessage });
    }
  }

  async getSubject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const subject = await this.subjectService.getById(id);
      
      if (!subject) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      
      res.json(subject);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching subject:', errorMessage);
      res.status(400).json({ error: errorMessage });
    }
  }

  async getAllSubjects(req: Request, res: Response) {
    try {
      const subjects = await this.subjectService.getAll();
      res.json(subjects);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error fetching all subjects:', errorMessage);
      res.status(400).json({ error: errorMessage });
    }
  }

  async searchSubjects(req: Request, res: Response) {
    try {
      const { term } = req.query;
      
      if (typeof term !== 'string') {
        return res.status(400).json({ error: 'Search term must be a string' });
      }

      const subjects = await this.subjectService.search(term);
      res.json(subjects);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logError('Error searching subjects:', errorMessage);
      res.status(400).json({ error: errorMessage });
    }
  }
}
