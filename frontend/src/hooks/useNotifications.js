import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await axios.get(`${API_URL}/admin/notifications?${params}`);
      setNotifications(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/admin/notifications`, data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateNotification = async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(`${API_URL}/admin/notifications/${id}`, data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    setLoading(true);
    setError(null);

    try {
      await axios.delete(`${API_URL}/admin/notifications/${id}`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete notification';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    notifications,
    totalPages,
    loading,
    error,
    fetchNotifications,
    createNotification,
    updateNotification,
    deleteNotification
  };
};
