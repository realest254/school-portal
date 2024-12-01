import { Request, Response } from 'express';
import { classService } from '../services/class.service';
import { logError } from '../utils/logger';
import { ClassNotFoundError, DuplicateClassError } from '../services/class.service';
import { ServiceError } from '../types/common.types';

export class ClassController {
    static async createClass(req: Request, res: Response) {
        try {
            const { name, grade, stream, academicYear } = req.body;

            const newClass = await classService.create({
                name,
                grade: Number(grade),
                stream,
                academicYear: Number(academicYear)
            });

            return res.status(201).json({
                success: true,
                data: newClass,
                message: 'Class created successfully'
            });
        } catch (error: unknown) {
            logError(error, 'ClassController.createClass');
            
            if (error instanceof DuplicateClassError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            if (error instanceof ServiceError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to create class'
            });
        }
    }

    static async getClasses(req: Request, res: Response) {
        try {
            const { page, limit, grade, academicYear, isActive } = req.query;

            const filters = {
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                grade: grade ? Number(grade) : undefined,
                academicYear: academicYear ? Number(academicYear) : undefined,
                isActive: isActive ? isActive === 'true' : undefined
            };

            const result = await classService.getAll(filters);

            return res.status(200).json({
                success: true,
                ...result
            });
        } catch (error: unknown) {
            logError(error, 'ClassController.getClasses');

            if (error instanceof ServiceError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to get classes'
            });
        }
    }

    static async getClass(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const class_ = await classService.getById(id);

            return res.status(200).json({
                success: true,
                data: class_
            });
        } catch (error: unknown) {
            logError(error, 'ClassController.getClass');

            if (error instanceof ClassNotFoundError) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to get class'
            });
        }
    }

    static async updateClass(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, grade, stream, academicYear, isActive } = req.body;

            const updatedClass = await classService.update(id, {
                name,
                grade: grade ? Number(grade) : undefined,
                stream,
                academicYear: academicYear ? Number(academicYear) : undefined,
                isActive
            });

            return res.status(200).json({
                success: true,
                data: updatedClass,
                message: 'Class updated successfully'
            });
        } catch (error: unknown) {
            logError(error, 'ClassController.updateClass');

            if (error instanceof ClassNotFoundError) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            if (error instanceof DuplicateClassError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            if (error instanceof ServiceError) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to update class'
            });
        }
    }

    static async deleteClass(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await classService.delete(id);

            return res.status(204).send();
        } catch (error: unknown) {
            logError(error, 'ClassController.deleteClass');

            if (error instanceof ClassNotFoundError) {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Failed to delete class'
            });
        }
    }
}
