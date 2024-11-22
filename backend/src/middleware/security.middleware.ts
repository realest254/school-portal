import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { sanitize } from 'isomorphic-dompurify';
import { ServiceError } from '../types/common.types';

// Rate limiting middleware
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100 // limit each IP to 100 requests per windowMs
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }
  });
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      const sanitizedBody = JSON.parse(
        JSON.stringify(req.body),
        (key: string, value: any) => {
          if (typeof value === 'string') {
            return sanitize(value);
          }
          return value;
        }
      );
      req.body = sanitizedBody;
    }

    if (req.query) {
      const sanitizedQuery = JSON.parse(
        JSON.stringify(req.query),
        (key: string, value: any) => {
          if (typeof value === 'string') {
            return sanitize(value);
          }
          return value;
        }
      );
      req.query = sanitizedQuery;
    }

    if (req.params) {
      const sanitizedParams = JSON.parse(
        JSON.stringify(req.params),
        (key: string, value: any) => {
          if (typeof value === 'string') {
            return sanitize(value);
          }
          return value;
        }
      );
      req.params = sanitizedParams;
    }

    next();
  } catch (error) {
    next(new ServiceError('Invalid input data', 'INVALID_INPUT', 400));
  }
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', error);

  if (error instanceof ServiceError) {
    return res.status(error.status).json({
      success: false,
      error: {
        message: error.message,
        code: error.code
      }
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
};
