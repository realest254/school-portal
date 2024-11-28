import { useCallback, useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import axios from 'axios';

const PRIORITIES = ['low', 'medium', 'high'];
const ROLES = ['admin', 'teacher', 'student'];
const STATUS = ['active', 'expired', 'deleted'];

export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const session = useSession();

  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    return {
      Authorization: `Bearer ${session.access_token}`
    };
  }, [session]);

  const validateNotification = (data) => {
    const errors = {};

    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    } else if (data.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    if (!data.message?.trim()) {
      errors.message = 'Message is required';
    } else if (data.message.length > 1000) {
      errors.message = 'Message must be less than 1000 characters';
    }

    if (!data.priority || !PRIORITIES.includes(data.priority)) {
      errors.priority = 'Valid priority (low, medium, high) is required';
    }

    if (!Array.isArray(data.target_audience) || data.target_audience.length === 0) {
      errors.target_audience = 'At least one target audience is required';
    } else if (!data.target_audience.every(role => ROLES.includes(role))) {
      errors.target_audience = 'Invalid target audience role(s)';
    }

    if (data.expires_at && new Date(data.expires_at) <= new Date()) {
      errors.expires_at = 'Expiry date must be in the future';
    }

    if (Object.keys(errors).length > 0) {
      throw new Error(JSON.stringify(errors));
    }
  };

  const fetchNotifications = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/notifications', {
        headers: getAuthHeaders(),
        params: { page, limit }
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch notifications');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNotifications = async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/notifications/user', {
        headers: getAuthHeaders(),
        params: { page, limit }
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user notifications');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (data) => {
    setLoading(true);
    setError(null);
    try {
      validateNotification(data);
      const response = await axios.post('/api/notifications', data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNotification = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      // For updates, only validate the fields that are being updated
      const validationData = {};
      if (data.title !== undefined) validationData.title = data.title;
      if (data.message !== undefined) validationData.message = data.message;
      if (data.priority !== undefined) validationData.priority = data.priority;
      if (data.target_audience !== undefined) validationData.target_audience = data.target_audience;
      if (data.expires_at !== undefined) validationData.expires_at = data.expires_at;
      
      if (Object.keys(validationData).length > 0) {
        validateNotification({ ...validationData });
      }

      // Validate status transitions
      if (data.status) {
        const currentNotification = await axios.get(`/api/notifications/${id}`, {
          headers: getAuthHeaders()
        });
        
        if (currentNotification.data.status === 'expired' && data.status === 'active') {
          throw new Error('Cannot reactivate expired notification');
        }
        
        if (!STATUS.includes(data.status)) {
          throw new Error('Invalid status value');
        }
      }

      const response = await axios.put(`/api/notifications/${id}`, data, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: getAuthHeaders()
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete notification');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchNotifications,
    fetchUserNotifications,
    createNotification,
    updateNotification,
    deleteNotification
  };
};
