import { Request, Response } from 'express';
import { ClassService } from '../services/class.service';
import { TeacherService } from '../services/teacher.service';
import { logError } from '../utils/logger';

export class ClassController {
  private static classService = new ClassService();

  static async createClass(req: Request, res: Response) {
    try {
      const { name, grade, stream, academicYear, teacherName } = req.body;

      // If teacher name is provided, find the teacher
      let classTeacherId = null;
      if (teacherName) {
        const teacher = await TeacherService.getTeacherByIdentifier({ name: teacherName });
        if (!teacher) {
          return res.status(400).json({ error: `Teacher with name "${teacherName}" not found` });
        }
        classTeacherId = teacher.id;
      }

      const newClass = await this.classService.create({
        name,
        grade,
        stream,
        academicYear,
        classTeacherId
      });

      res.status(201).json(newClass);
    } catch (error) {
      logError(error, 'ClassController.createClass');
      res.status(500).json({ error: 'Failed to create class' });
    }
  }

  static async getClasses(req: Request, res: Response) {
    try {
      const classes = await this.classService.getAll();
      res.json(classes);
    } catch (error) {
      logError(error, 'ClassController.getClasses');
      res.status(500).json({ error: 'Failed to get classes' });
    }
  }

  static async deleteClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.classService.delete(id);
      res.status(204).send();
    } catch (error) {
      logError(error, 'ClassController.deleteClass');
      res.status(500).json({ error: 'Failed to delete class' });
    }
  }
}
