import { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { UserRole } from '../middlewares/auth.middleware';
import { z } from 'zod';

// Teacher schemas
const teacherCreateSchema = z.object({
  name: z.string().min(1).max(100),
  employeeId: z.string().min(1).max(50),
  email: z.string().email(),
  subject: z.string().min(1).max(100),
  phone: z.string().regex(/^\d{10}$/),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const teacherUpdateSchema = teacherCreateSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional()
});

export const teacherValidation = {
  validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = data;
      } else {
        req.body = data;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  create: (req: Request, res: Response, next: NextFunction) => {
    teacherValidation.validate(teacherCreateSchema)(req, res, next);
  },

  update: (req: Request, res: Response, next: NextFunction) => {
    teacherValidation.validate(teacherUpdateSchema)(req, res, next);
  }
};

// Student schemas
const studentGetAllSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  search: z.string().optional()
});

const studentGetByIdSchema = z.object({
  id: z.string().uuid()
});

const studentCreateSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  grade: z.number().int().min(1).max(12),
  section: z.string().min(1),
  guardianPhone: z.string().regex(/^\d{10}$/),
  address: z.string().optional()
});

const studentUpdateSchema = studentCreateSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional()
});

export const studentValidation = {
  validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = data;
      } else {
        req.body = data;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  getAll: (req: Request, res: Response, next: NextFunction) => {
    studentValidation.validate(studentGetAllSchema)(req, res, next);
  },

  getById: (req: Request, res: Response, next: NextFunction) => {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    next();
  },

  create: (req: Request, res: Response, next: NextFunction) => {
    studentValidation.validate(studentCreateSchema)(req, res, next);
  },

  update: (req: Request, res: Response, next: NextFunction) => {
    studentValidation.validate(studentUpdateSchema)(req, res, next);
  },

  delete: (req: Request, res: Response, next: NextFunction) => {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    next();
  }
};

// Stats schemas
const statsGetStatsSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
});

export const statsValidation = {
  validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = data;
      } else {
        req.body = data;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  getStats: (req: Request, res: Response, next: NextFunction) => {
    statsValidation.validate(statsGetStatsSchema)(req, res, next);
  }
};

// Notification schemas
const notificationCreateSchema = z.object({
  title: z.string().min(2).max(200),
  message: z.string().min(1).max(2000),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  target_audience: z.array(z.enum(['admin', 'teacher', 'student'])),
  expires_at: z.string().transform((val) => new Date(val)).optional()
});

const notificationUpdateSchema = notificationCreateSchema.partial().extend({
  status: z.enum(['active', 'expired', 'deleted']).optional()
});

const notificationFilterSchema = z.object({
  status: z.enum(['active', 'expired', 'deleted']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  page: z.string().transform((val) => parseInt(val, 10)).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional()
});

export const notificationValidation = {
  validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = data;
      } else {
        req.body = data;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  create: (req: Request, res: Response, next: NextFunction) => {
    notificationValidation.validate(notificationCreateSchema)(req, res, next);
  },

  update: (req: Request, res: Response, next: NextFunction) => {
    notificationValidation.validate(notificationUpdateSchema)(req, res, next);
  },

  getAll: (req: Request, res: Response, next: NextFunction) => {
    notificationValidation.validate(notificationFilterSchema)(req, res, next);
  },

  getById: (req: Request, res: Response, next: NextFunction) => {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    next();
  },

  delete: (req: Request, res: Response, next: NextFunction) => {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    next();
  }
};

// Class schemas
const classCreateSchema = z.object({
  name: z.string().min(1).max(100)
});

export const classValidation = {
  validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = data;
      } else {
        req.body = data;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  create: (req: Request, res: Response, next: NextFunction) => {
    classValidation.validate(classCreateSchema)(req, res, next);
  }
};

// Subject schemas
const subjectCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  gradeLevel: z.number().int().min(1).max(12).optional()
});

const subjectUpdateSchema = subjectCreateSchema.partial();

export const subjectValidation = {
  validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = data;
      } else {
        req.body = data;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  create: (req: Request, res: Response, next: NextFunction) => {
    subjectValidation.validate(subjectCreateSchema)(req, res, next);
  },

  update: (req: Request, res: Response, next: NextFunction) => {
    subjectValidation.validate(subjectUpdateSchema)(req, res, next);
  }
};

// Invite schemas
const inviteCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(['teacher', 'student', 'admin']),
  expiresAt: z.string().transform((val) => new Date(val)).optional(),
  metadata: z.object().optional()
});

const inviteBulkCreateSchema = z.array(z.object({
  email: z.string().email(),
  role: z.enum(['teacher', 'student', 'admin'])
}));

export const inviteValidation = {
  validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.method === 'GET' ? req.query : req.body);
      if (req.method === 'GET') {
        req.query = data;
      } else {
        req.body = data;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Validation failed' });
      }
    }
  },

  create: (req: Request, res: Response, next: NextFunction) => {
    inviteValidation.validate(inviteCreateSchema)(req, res, next);
  },

  bulkCreate: (req: Request, res: Response, next: NextFunction) => {
    inviteValidation.validate(inviteBulkCreateSchema)(req, res, next);
  }
};
