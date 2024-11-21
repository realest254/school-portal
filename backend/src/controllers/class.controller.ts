import { Request, Response } from 'express';
import { ClassService } from '../services/class.service';
import { logError } from '../utils/logger';

export class ClassController {
  static async createClass(req: Request, res: Response) {
    try {
      const { name } = req.body;
      const newClass = await ClassService.createClass(name);
      res.status(201).json(newClass);
    } catch (error) {
      logError(error, 'ClassController.createClass');
      res.status(500).json({ error: 'Failed to create class' });
    }
  }

  static async getClasses(req: Request, res: Response) {
    try {
      const classes = await ClassService.getClasses();
      res.json(classes);
    } catch (error) {
      logError(error, 'ClassController.getClasses');
      res.status(500).json({ error: 'Failed to get classes' });
    }
  }

  static async deleteClass(req: Request, res: Response) {
    try {
      const { name } = req.params;
      await ClassService.deleteClass(name);
      res.status(204).send();
    } catch (error) {
      logError(error, 'ClassController.deleteClass');
      res.status(500).json({ error: 'Failed to delete class' });
    }
  }
}
