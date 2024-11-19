import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logError, logInfo } from '../utils/logger';
import { AuthenticatedRequest } from '../middlewares/adminAuth.middleware';
import { validationResult } from 'express-validator';

export class ClassController {
  /**
   * Get all classes with optional filters
   */
  static async getAllClasses(req: Request, res: Response) {
    try {
      const { academicYear, term, isActive, search, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = supabase
        .from('classes')
        .select(`
          *,
          teachers:class_teachers(
            teacher:profiles(*)
          ),
          students:class_students(
            student:profiles(*)
          )
        `, { count: 'exact' });

      if (academicYear) {
        query = query.eq('academic_year', academicYear);
      }

      if (term) {
        query = query.eq('term', term);
      }

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
      }

      const { data: classes, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) throw error;

      logInfo('Classes fetched successfully', { count });

      return res.status(200).json({
        classes,
        total: count,
        page: Number(page),
        totalPages: Math.ceil((count || 0) / Number(limit))
      });
    } catch (error) {
      logError(error, 'getAllClasses');
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }
  }

  /**
   * Create a new class
   */
  static async createClass(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, code, academicYear, term, teacherId, isPrimaryTeacher = true } = req.body;

      // Start a transaction
      const { data: newClass, error } = await supabase.rpc('create_class', {
        p_name: name,
        p_code: code,
        p_academic_year: academicYear,
        p_term: term,
        p_teacher_id: teacherId,
        p_is_primary_teacher: isPrimaryTeacher
      });

      if (error) throw error;

      logInfo('Class created successfully', { classId: newClass.id });

      return res.status(201).json({
        message: 'Class created successfully',
        class: newClass
      });
    } catch (error) {
      logError(error, 'createClass');
      return res.status(500).json({ error: 'Failed to create class' });
    }
  }

  /**
   * Update class details
   */
  static async updateClass(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, code, isActive } = req.body;

      const { data: updatedClass, error } = await supabase
        .from('classes')
        .update({
          name,
          code,
          is_active: isActive,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!updatedClass) {
        return res.status(404).json({ error: 'Class not found' });
      }

      logInfo('Class updated successfully', { classId: id });

      return res.status(200).json({
        message: 'Class updated successfully',
        class: updatedClass
      });
    } catch (error) {
      logError(error, 'updateClass');
      return res.status(500).json({ error: 'Failed to update class' });
    }
  }

  /**
   * Delete a class
   */
  static async deleteClass(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if class has any students
      const { data: students, error: studentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', id);

      if (studentsError) throw studentsError;

      if (students && students.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete class with enrolled students. Please remove all students first.'
        });
      }

      // Delete class (will cascade to class_teachers due to foreign key)
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      logInfo('Class deleted successfully', { classId: id });

      return res.status(200).json({
        message: 'Class deleted successfully'
      });
    } catch (error) {
      logError(error, 'deleteClass');
      return res.status(500).json({ error: 'Failed to delete class' });
    }
  }

  /**
   * Assign teacher to class
   */
  static async assignTeacher(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { teacherId, isPrimary = false } = req.body;

      // Check if teacher is already assigned to this class
      const { data: existingAssignment } = await supabase
        .from('class_teachers')
        .select('*')
        .eq('class_id', id)
        .eq('teacher_id', teacherId)
        .single();

      if (existingAssignment) {
        return res.status(400).json({
          error: 'Teacher is already assigned to this class'
        });
      }

      // If this is a primary teacher, remove primary status from other teachers
      if (isPrimary) {
        await supabase
          .from('class_teachers')
          .update({ is_primary: false })
          .eq('class_id', id)
          .eq('is_primary', true);
      }

      // Assign teacher to class
      const { data: assignment, error } = await supabase
        .from('class_teachers')
        .insert({
          class_id: id,
          teacher_id: teacherId,
          is_primary: isPrimary
        })
        .select(`
          *,
          teacher:profiles(*),
          class:classes(*)
        `)
        .single();

      if (error) throw error;

      logInfo('Teacher assigned to class successfully', {
        classId: id,
        teacherId
      });

      return res.status(200).json({
        message: 'Teacher assigned successfully',
        assignment
      });
    } catch (error) {
      logError(error, 'assignTeacher');
      return res.status(500).json({ error: 'Failed to assign teacher' });
    }
  }

  /**
   * Get class statistics
   */
  static async getClassStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data: stats, error } = await supabase.rpc('get_class_statistics', {
        p_class_id: id
      });

      if (error) throw error;

      logInfo('Class statistics fetched successfully', { classId: id });

      return res.status(200).json({
        stats
      });
    } catch (error) {
      logError(error, 'getClassStats');
      return res.status(500).json({ error: 'Failed to fetch class statistics' });
    }
  }
}
