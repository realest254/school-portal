import { Request, Response } from 'express';
import { SubjectService } from '../services/subject.service';
import { AuthenticatedRequest } from '../middlewares/adminAuth.middleware';

export class SubjectController {
  private subjectService: SubjectService;

  constructor() {
    this.subjectService = new SubjectService();
  }

  async createSubject(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const subject = await this.subjectService.create(req.body);
      res.status(201).json(subject);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateSubject(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const subject = await this.subjectService.update(id, req.body);
      res.json(subject);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteSubject(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      await this.subjectService.delete(id);
      res.json({ message: 'Subject deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllSubjects(req: Request, res: Response) {
    try {
      const subjects = await this.subjectService.getAll();
      res.json(subjects);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
