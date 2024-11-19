import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { UserRole } from '../middlewares/auth.middleware';
import { NOTIFICATION_DEFAULTS } from '../config';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  create = async (req: Request, res: Response) => {
    try {
      const notification = await this.notificationService.create(req.body);
      res.status(201).json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create notification' });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.update(id, req.body);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update notification' });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.notificationService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' });
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
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.getById(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notification' });
    }
  };

  getForRecipient = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
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
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  };
}
