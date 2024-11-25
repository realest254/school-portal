/**
 * TeacherService: Frontend service for teacher-related API calls
 * 
 * Purpose:
 * - Acts as API client for teacher endpoints
 * - Manages teacher information
 * - Handles teacher CRUD operations
 * - Manages teacher status
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';

export class TeacherService {
  static async getTeachers({ page = 1, limit = 10, status, search }) {
    try {
      const params = {
        page,
        limit,
        ...(status && { status }),
        ...(search && { search })
      };
      
      const response = await axios.get(`${API_BASE_URL}/api/teachers`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async getTeacherByIdentifier(identifier) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/teachers/${identifier}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async createTeacher(teacherData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/teachers`, teacherData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async updateTeacher(id, teacherData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/teachers/${id}`, teacherData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async deleteTeacher(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/teachers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}