import { supabase } from '../lib/supabase';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class IndisciplineService {
  async getAll(filters = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);

    try {
      const response = await axios.get(`${API_URL}/indiscipline?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch indiscipline records');
    }
  }

  async getById(admissionNumber) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    try {
      const response = await axios.get(`${API_URL}/indiscipline/${admissionNumber}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch indiscipline record');
    }
  }

  async create(data) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    try {
      const response = await axios.post(`${API_URL}/indiscipline`, data, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create indiscipline record');
    }
  }

  async update(id, data) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    try {
      const response = await axios.put(`${API_URL}/indiscipline/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update indiscipline record');
    }
  }

  async delete(id) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    try {
      const response = await axios.delete(`${API_URL}/indiscipline/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete indiscipline record');
    }
  }
}

export default new IndisciplineService();
