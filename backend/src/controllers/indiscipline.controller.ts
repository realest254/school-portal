import { Request, Response } from 'express';
import { IndisciplineService } from '../services/indiscipline.service';
import { logError, logInfo } from '../utils/logger';

export class IndisciplineController {
  private service: IndisciplineService;

  constructor() {
    this.service = new IndisciplineService();
  }

  create = async (req: Request, res: Response) => {
    try {
      const result = await this.service.create(req.body);
      logInfo('Created indiscipline record', { recordId: result.id });
      res.status(201).json(result);
    } catch (error) {
      logError(error, 'IndisciplineController.create');
      res.status(500).json({ error: 'Failed to create indiscipline record' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.service.update(id, req.body);
      
      if (!result) {
        logInfo('Indiscipline record not found for update', { id });
        return res.status(404).json({ error: 'Indiscipline record not found' });
      }
      
      logInfo('Updated indiscipline record', { recordId: id });
      res.json(result);
    } catch (error) {
      logError(error, 'IndisciplineController.update');
      res.status(500).json({ error: 'Failed to update indiscipline record' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.service.delete(id);
      
      if (!result) {
        logInfo('Indiscipline record not found for deletion', { id });
        return res.status(404).json({ error: 'Indiscipline record not found' });
      }
      
      logInfo('Deleted indiscipline record', { recordId: id });
      res.json(result);
    } catch (error) {
      logError(error, 'IndisciplineController.delete');
      res.status(500).json({ error: 'Failed to delete indiscipline record' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.service.getById(id);
      
      if (!result) {
        logInfo('Indiscipline record not found', { id });
        return res.status(404).json({ error: 'Indiscipline record not found' });
      }
      
      res.json(result);
    } catch (error) {
      logError(error, 'IndisciplineController.getById');
      res.status(500).json({ error: 'Failed to get indiscipline record' });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const filters = {
        student_id: req.query.student_id as string,
        severity: req.query.severity as string,
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      
      const results = await this.service.getAll(filters);
      res.json(results);
    } catch (error) {
      logError(error, 'IndisciplineController.getAll');
      res.status(500).json({ error: 'Failed to fetch indiscipline records' });
    }
  };

  getByStudentId = async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const results = await this.service.getByStudentId(studentId);
      res.json(results);
    } catch (error) {
      logError(error, 'IndisciplineController.getByStudentId');
      res.status(500).json({ error: 'Failed to fetch student indiscipline records' });
    }
  };
}
