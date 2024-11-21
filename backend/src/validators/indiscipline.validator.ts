import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createSchema = z.object({
  student_id: z.string().uuid(),
  reported_by: z.string().uuid(),
  incident_date: z.string().transform((val) => new Date(val)),
  description: z.string().min(1).max(1000),
  severity: z.enum(['minor', 'moderate', 'severe']),
  status: z.enum(['active', 'resolved', 'deleted']),
  action_taken: z.string().max(1000).optional(),
});

const updateSchema = createSchema.partial();

const filterSchema = z.object({
  student_id: z.string().uuid().optional(),
  severity: z.enum(['minor', 'moderate', 'severe']).optional(),
  status: z.enum(['active', 'resolved', 'deleted']).optional(),
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
});

export const indisciplineValidation = {
  validateCreate: (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = createSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  validateUpdate: (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = updateSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  validateFilters: (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        student_id: req.query.student_id,
        severity: req.query.severity,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      req.query = filterSchema.parse(filters);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },
};
