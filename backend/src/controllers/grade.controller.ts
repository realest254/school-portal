import { Request, Response, NextFunction } from 'express';
import { gradeService } from '../services/grade.service';
import { GradeSchema, BulkGradesSchema, GradeQuerySchema } from '../validators/grade.validator';
import { teacherService } from '../services/teacher.service';
import { ServiceError } from '../types/common.types';

export const getGrades = async (req: Request, res: Response) => {
  try {
    const query = await GradeQuerySchema.parseAsync(req.query);
    const grades = await gradeService.getGrades(query);
    res.json(grades);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Invalid query parameters' });
    }
  }
};

export const submitGrades = async (req: Request, res: Response) => {
  try {
    // Validate teacher's access to class
    const teacherEmail = req.user?.email;
    if (!teacherEmail) {
      throw new ServiceError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { grades } = await BulkGradesSchema.parseAsync(req.body);
    
    // Verify all grades belong to teacher's class
    const teacher = await teacherService.getTeacherByIdentifier({ email: teacherEmail });
    const teacherClassId = teacher.data.class?.id;
    
    if (!teacherClassId) {
      throw new ServiceError('Teacher not assigned to any class', 'NO_CLASS_ASSIGNED', 400);
    }

    // Verify all grades are for teacher's class
    const invalidGrade = grades.find(grade => grade.class_id !== teacherClassId);
    if (invalidGrade) {
      throw new ServiceError('Unauthorized to submit grades for this class', 'UNAUTHORIZED_CLASS', 403);
    }

    const result = await gradeService.submitGrades(grades);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Invalid grade data' });
    }
  }
};

export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const grade = await GradeSchema.partial().parseAsync(req.body);
    
    // Verify teacher's access
    const teacherEmail = req.user?.email;
    if (!teacherEmail) {
      throw new ServiceError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const teacher = await teacherService.getTeacherByIdentifier({ email: teacherEmail });
    const teacherClassId = teacher.data.class?.id;

    if (!teacherClassId) {
      throw new ServiceError('Teacher not assigned to any class', 'NO_CLASS_ASSIGNED', 400);
    }

    const result = await gradeService.updateGrade(id, grade);
    res.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Invalid grade data' });
    }
  }
};

export const deleteGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await gradeService.deleteGrade(id);
    res.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getStudentGrades = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const result = await gradeService.getStudentGrades(studentId);
    res.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getClassGrades = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { term, year } = req.query;
    
    const result = await gradeService.getClassGrades(
      classId,
      term ? parseInt(term as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    res.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getGradeStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, term, year, examName } = req.query;

    if (!classId || !term || !year || !examName) {
      throw new Error('Missing required parameters');
    }

    const result = await gradeService.getGradeStatistics(
      classId as string,
      parseInt(term as string),
      parseInt(year as string),
      examName as string
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};
