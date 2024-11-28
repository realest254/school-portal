import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { UserRole } from '../middlewares/auth.middleware';
import { NOTIFICATION_DEFAULTS } from '../config';
import { NotificationError } from '../errors/notification.errors';
import { logger } from '../utils/logger';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  private handleError(error: any, res: Response) {
    if (error instanceof NotificationError) {
      logger.warn(`Notification error: ${error.code} - ${error.message}`, {
        errorDetails: error.details
      });
      return res.status(error.status).json({
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    logger.error('Unexpected notification error:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred',
      code: 'NOTIFICATION.UNEXPECTED_ERROR'
    });
  }

  create = async (req: Request, res: Response) => {
    try {
      const notification = await this.notificationService.create(req.body);
      logger.info('Notification created', { id: notification.id });
      res.status(201).json(notification);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.update(id, req.body);
      logger.info('Notification updated', { id });
      res.json(notification);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.notificationService.delete(id);
      logger.info('Notification deleted', { id });
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = NOTIFICATION_DEFAULTS.PAGE_SIZE, ...filters } = req.query;
      const notifications = await this.notificationService.getAll(
        Number(page),
        Number(limit),
        filters
      );
      res.json(notifications);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.getById(id);
      if (!notification) {
        throw new NotificationError(
          'Notification not found',
          'NOTIFICATION.NOT_FOUND',
          404
        );
      }
      res.json(notification);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  getForRecipient = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new NotificationError(
          'Authentication required',
          'NOTIFICATION.UNAUTHORIZED',
          401
        );
      }

      const { page = 1, limit = NOTIFICATION_DEFAULTS.PAGE_SIZE } = req.query;
      const notifications = await this.notificationService.getForRecipient(
        req.user.id,
        req.user.role as UserRole,
        Number(page),
        Number(limit)
      );
      res.json(notifications);
    } catch (error) {
      this.handleError(error, res);
    }
  };
}
