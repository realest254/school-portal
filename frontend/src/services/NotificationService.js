import axios from 'axios';
import { API_BASE_URL } from '../config';

class NotificationServiceClass {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/notifications`;
  }

  async getNotifications(filters = {}) {
    try {
      const { status, page, limit } = filters;
      const response = await axios.get(this.baseUrl, {
        params: {
          status,
          page,
          limit
        }
      });
      
      if (response.data.success) {
        return {
          data: response.data.data,
          total: response.data.total,
          success: true
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch notification');
      }
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  }

  async createNotification(notificationData) {
    try {
      const response = await axios.post(this.baseUrl, notificationData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to create notification');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async updateNotification(id, notificationData) {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, notificationData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to update notification');
      }
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  async deleteNotification(id) {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      
      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export const NotificationService = new NotificationServiceClass();