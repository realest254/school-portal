import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { notificationService } from '../services/notification.service';
import { UserRole } from '../middlewares/auth.middleware';
import { NOTIFICATION_DEFAULTS } from '../config';
import { ServiceError } from '../types/common.types';
import { AuthenticatedRequest, checkIsAdminOrError } from '../types/auth.types';
import { logError } from '../utils/logger';

interface CreateNotificationData {
  title: string;
  message: string;
  type: string;
  targetAudience: string[];
  scheduledFor?: Date;
  expiresAt?: Date;
}

export class NotificationController {
  /**
   * Create a new notification
   * Access: Admin only
   */
  static async createNotification(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const notification = await notificationService.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'NotificationController.createNotification');
      return res.status(500).json({
        success: false,
        error: 'Failed to create notification'
      });
    }
  }

  /**
   * Update a notification
   * Access: Admin only
   */
  static async updateNotification(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const { id } = req.params;
      const notification = await notificationService.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Notification updated successfully',
        data: notification
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'NotificationController.updateNotification');
      return res.status(500).json({
        success: false,
        error: 'Failed to update notification'
      });
    }
  }

  /**
   * Delete a notification
   * Access: Admin only
   */
  static async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const { id } = req.params;
      await notificationService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'NotificationController.deleteNotification');
      return res.status(500).json({
        success: false,
        error: 'Failed to delete notification'
      });
    }
  }

  /**
   * Get all notifications with optional filters
   * Access: Admin only
   */
  static async getAllNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { status, page, limit } = req.query;
      
      // Validate status if provided
      let validatedStatus: 'active' | 'expired' | 'deleted' | undefined;
      if (status) {
        if (['active', 'expired', 'deleted'].includes(status as string)) {
          validatedStatus = status as 'active' | 'expired' | 'deleted';
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid status value. Must be one of: 'active', 'expired', 'deleted'"
          });
        }
      }

      const result = await notificationService.getAll({
        status: validatedStatus,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'NotificationController.getAllNotifications');
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications'
      });
    }
  }

  /**
   * Get a notification by ID
   * Access: Admin only
   */
  static async getNotification(req: AuthenticatedRequest, res: Response) {
    try {
      checkIsAdminOrError(req.user);

      const { id } = req.params;
      const notification = await notificationService.getById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(errorMessage, 'NotificationController.getNotification');
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch notification'
      });
    }
  }
}
