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
      await this.service.delete(id);
      logInfo('Deleted indiscipline record', { recordId: id });
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: 'Indiscipline record not found' });
      }
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
      // Define the type for our query filters
      type FilterKeys = 'severity' | 'status' | 'startDate' | 'endDate' | 'studentAdmissionNumber';
      const queryFilters: Record<FilterKeys, string | undefined> = {
        severity: req.query.severity as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        studentAdmissionNumber: req.query.studentAdmissionNumber as string
      };

      // Create a type-safe filter object with date conversion
      const filters = {
        severity: queryFilters.severity,
        status: queryFilters.status,
        startDate: queryFilters.startDate ? new Date(queryFilters.startDate) : undefined,
        endDate: queryFilters.endDate ? new Date(queryFilters.endDate) : undefined,
        studentAdmissionNumber: queryFilters.studentAdmissionNumber
      };
      
      // Remove undefined values using type-safe keys
      (Object.keys(filters) as Array<keyof typeof filters>).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });
      
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
