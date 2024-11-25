/**
 * StudentService: Frontend service for student-related API calls
 * 
 * Purpose:
 * - Acts as API client for student endpoints
 * - Retrieves student grades and assignments
 * - Manages student profile information
 * - Handles course enrollments
 * - Fetches class schedules
 * - Manages assignment submissions
 */

import axios from 'axios';
import { API_BASE_URL } from '../config';

export class StudentService {
  static async getStudents({ page = 1, limit = 10, status, search, class: className }) {
    try {
      const params = {
        page,
        limit,
        ...(status && { status }),
        ...(search && { search }),
        ...(className && { class: className })
      };
      
      const response = await axios.get(`${API_BASE_URL}/api/students`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async getStudentById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async createStudent(studentData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/students`, studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async updateStudent(id, studentData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/students/${id}`, studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  static async deleteStudent(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/students/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}