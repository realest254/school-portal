import { notificationTestService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';

describe('NotificationTestService', () => {
  beforeEach(async () => {
    await notificationTestService.initialize();
  });

  afterEach(async () => {
    await notificationTestService.cleanup();
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: 'high' as const,
        target_audience: ['admin', 'teacher']
      };

      const notification = await notificationTestService.create(notificationData);

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.title).toBe(notificationData.title);
      expect(notification.message).toBe(notificationData.message);
      expect(notification.priority).toBe(notificationData.priority);
      expect(notification.target_audience).toEqual(notificationData.target_audience);
      expect(notification.status).toBe('active');
      expect(notification.created_at).toBeInstanceOf(Date);
    });

    it('should create a notification with expiration date', async () => {
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + 7);

      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: 'medium' as const,
        target_audience: ['student'],
        expires_at
      };

      const notification = await notificationTestService.create(notificationData);

      expect(notification.expires_at).toBeInstanceOf(Date);
      expect(notification.expires_at?.getTime()).toBe(expires_at.getTime());
    });

    it('should throw error for invalid data', async () => {
      const invalidData = {
        title: 'Test',
        message: 'Test',
        priority: 'invalid',
        target_audience: ['invalid']
      };

      await expect(notificationTestService.create(invalidData)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should get notification by id', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        priority: 'low' as const,
        target_audience: ['admin']
      };

      const created = await notificationTestService.create(notificationData);
      const retrieved = await notificationTestService.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent notification', async () => {
      const result = await notificationTestService.getById(uuidv4());
      expect(result).toBeNull();
    });

    it('should throw error for invalid id', async () => {
      await expect(notificationTestService.getById('invalid-id')).rejects.toThrow();
    });
  });

  describe('getAll', () => {
    it('should get all notifications with pagination', async () => {
      const notifications = await Promise.all([
        notificationTestService.create({
          title: 'Test 1',
          message: 'Message 1',
          priority: 'high' as const,
          target_audience: ['admin']
        }),
        notificationTestService.create({
          title: 'Test 2',
          message: 'Message 2',
          priority: 'medium' as const,
          target_audience: ['teacher']
        })
      ]);

      const result = await notificationTestService.getAll(1, 10, {});

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter notifications by priority', async () => {
      await Promise.all([
        notificationTestService.create({
          title: 'High Priority',
          message: 'Test',
          priority: 'high' as const,
          target_audience: ['admin']
        }),
        notificationTestService.create({
          title: 'Low Priority',
          message: 'Test',
          priority: 'low' as const,
          target_audience: ['admin']
        })
      ]);

      const result = await notificationTestService.getAll(1, 10, { priority: 'high' });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].priority).toBe('high');
    });
  });

  describe('getForRecipient', () => {
    it('should get notifications for specific role', async () => {
      await Promise.all([
        notificationTestService.create({
          title: 'Admin Only',
          message: 'Test',
          priority: 'high' as const,
          target_audience: ['admin']
        }),
        notificationTestService.create({
          title: 'Teacher Only',
          message: 'Test',
          priority: 'medium' as const,
          target_audience: ['teacher']
        })
      ]);

      const result = await notificationTestService.getForRecipient(
        uuidv4(),
        'admin',
        1,
        10
      );

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].title).toBe('Admin Only');
    });

    it('should not return expired notifications', async () => {
      const expires_at = new Date();
      expires_at.setDate(expires_at.getDate() - 1);

      await notificationTestService.create({
        title: 'Expired Notification',
        message: 'Test',
        priority: 'high' as const,
        target_audience: ['admin'],
        expires_at
      });

      const result = await notificationTestService.getForRecipient(
        uuidv4(),
        'admin',
        1,
        10
      );

      expect(result.notifications).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update notification', async () => {
      const created = await notificationTestService.create({
        title: 'Original Title',
        message: 'Original Message',
        priority: 'low' as const,
        target_audience: ['admin']
      });

      const updated = await notificationTestService.update(created.id, {
        title: 'Updated Title',
        message: 'Updated Message'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.message).toBe('Updated Message');
      expect(updated.id).toBe(created.id);
    });

    it('should throw error when no fields to update', async () => {
      const created = await notificationTestService.create({
        title: 'Test',
        message: 'Test',
        priority: 'low' as const,
        target_audience: ['admin']
      });

      await expect(notificationTestService.update(created.id, {})).rejects.toThrow('No fields to update');
    });
  });

  describe('delete', () => {
    it('should mark notification as deleted', async () => {
      const created = await notificationTestService.create({
        title: 'To Delete',
        message: 'Test',
        priority: 'low' as const,
        target_audience: ['admin']
      });

      await notificationTestService.delete(created.id);
      const retrieved = await notificationTestService.getById(created.id);

      expect(retrieved).toBeNull();
    });

    it('should throw error for invalid id', async () => {
      await expect(notificationTestService.delete('invalid-id')).rejects.toThrow();
    });
  });
});
