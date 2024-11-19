import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { StudentService } from '../services/student.service';
import { logError } from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/adminAuth.middleware';

interface CreateStudentData {
  name: string;
  admissionNumber: string;
  email: string;
  class: string;
  parentPhone: string;
  dob: string;
}

export class StudentController {
  /**
   * Get all students with optional filters
   */
  static async getAllStudents(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, class: classFilter, search, page, limit } = req.query;
      
      const result = await StudentService.getStudents({
        status: status as string,
        class: classFilter as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      return res.status(200).json(result);
    } catch (error) {
      logError(error, 'StudentController.getAllStudents');
      return res.status(500).json({ error: 'Failed to fetch students' });
    }
  }

  /**
   * Get a student by ID
   */
  static async getStudentById(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const student = await StudentService.getStudentById(id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.status(200).json(student);
    } catch (error) {
      logError(error, 'StudentController.getStudentById');
      return res.status(500).json({ error: 'Failed to fetch student' });
    }
  }

  /**
   * Create a new student
   */
  static async createStudent(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const studentData: CreateStudentData = req.body;
      
      const student = await StudentService.createStudent(studentData);

      return res.status(201).json({
        message: 'Student created successfully',
        student
      });
    } catch (error) {
      logError(error, 'StudentController.createStudent');
      if (error.message === 'Email already registered') {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to create student' });
    }
  }

  /**
   * Update student details
   */
  static async updateStudent(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      const student = await StudentService.updateStudent(id, updateData);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      return res.status(200).json({
        message: 'Student updated successfully',
        student
      });
    } catch (error) {
      logError(error, 'StudentController.updateStudent');
      return res.status(500).json({ error: 'Failed to update student' });
    }
  }

  /**
   * Delete a student
   */
  static async deleteStudent(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      await StudentService.deleteStudent(id);

      return res.status(200).json({
        message: 'Student deleted successfully'
      });
    } catch (error) {
      logError(error, 'StudentController.deleteStudent');
      return res.status(500).json({ error: 'Failed to delete student' });
    }
  }

  /**
   * Get student's academic progress
   */
  static async getStudentProgress(req: AuthenticatedRequest, res: Response) {
    try {
      // Ensure user is admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }

      const { id } = req.params;
      const progress = await StudentService.getStudentProgress(id);

      return res.status(200).json({ progress });
    } catch (error) {
      logError(error, 'StudentController.getStudentProgress');
      return res.status(500).json({ error: 'Failed to fetch student progress' });
    }
  }
}
