import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { classService } from '../services/class.service';
import { logError } from '../utils/logger';
import { UserRole } from '../middlewares/auth.middleware';
import { ServiceError } from '../types/common.types';
import { 
    AuthenticatedRequest, 
    checkIsAdminOrError 
} from '../types/auth.types';

interface CreateClassData {
    name: string;
    grade: number;
    stream?: string;
    academicYear: number;
}

export class ClassController {
    /**
     * Create a new class
     * Access: Admin only
     */
    static async createClass(req: AuthenticatedRequest, res: Response) {
        try {
            checkIsAdminOrError(req.user);

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const classData: CreateClassData = {
                name: req.body.name,
                grade: Number(req.body.grade),
                stream: req.body.stream,
                academicYear: Number(req.body.academicYear)
            };

            try {
                const newClass = await classService.create(classData);
                return res.status(201).json({
                    success: true,
                    data: newClass,
                    message: 'Class created successfully'
                });
            } catch (error) {
                if (error instanceof ServiceError) {
                    return res.status(400).json({
                        success: false,
                        error: error.message
                    });
                }
                throw error;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logError(errorMessage, 'ClassController.createClass');
            return res.status(500).json({
                success: false,
                error: 'Failed to create class'
            });
        }
    }

    /**
     * Get all classes with optional filters
     * Access: Admin only
     */
    static async getAllClasses(req: AuthenticatedRequest, res: Response) {
        try {
            checkIsAdminOrError(req.user);

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const { grade, academicYear, isActive, page, limit } = req.query;

            try {
                const result = await classService.getAll({
                    grade: grade ? Number(grade) : undefined,
                    academicYear: academicYear ? Number(academicYear) : undefined,
                    isActive: isActive ? isActive === 'true' : undefined,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined
                });

                return res.status(200).json({
                    success: true,
                    ...result
                });
            } catch (error) {
                if (error instanceof ServiceError) {
                    return res.status(400).json({
                        success: false,
                        error: error.message
                    });
                }
                throw error;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logError(errorMessage, 'ClassController.getAllClasses');
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch classes'
            });
        }
    }

    /**
     * Get a class by name
     * Access: Admin only
     */
    static async getClass(req: AuthenticatedRequest, res: Response) {
        try {
            checkIsAdminOrError(req.user);

            const { name } = req.params;
            
            try {
                const class_ = await classService.getByName(name);
                return res.status(200).json({
                    success: true,
                    data: class_
                });
            } catch (error) {
                if (error instanceof ServiceError) {
                    return res.status(404).json({
                        success: false,
                        error: error.message
                    });
                }
                throw error;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logError(errorMessage, 'ClassController.getClass');
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch class'
            });
        }
    }

    /**
     * Update a class
     * Access: Admin only
     */
    static async updateClass(req: AuthenticatedRequest, res: Response) {
        try {
            checkIsAdminOrError(req.user);

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors.array() 
                });
            }

            const { id } = req.params;
            const { name, grade, stream, academicYear, isActive } = req.body;

            try {
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
            } catch (error) {
                if (error instanceof ServiceError) {
                    return res.status(400).json({
                        success: false,
                        error: error.message
                    });
                }
                throw error;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logError(errorMessage, 'ClassController.updateClass');
            return res.status(500).json({
                success: false,
                error: 'Failed to update class'
            });
        }
    }

    /**
     * Delete a class
     * Access: Admin only
     */
    static async deleteClass(req: AuthenticatedRequest, res: Response) {
        try {
            checkIsAdminOrError(req.user);

            const { id } = req.params;
            
            try {
                await classService.delete(id);
                return res.status(204).send();
            } catch (error) {
                if (error instanceof ServiceError) {
                    return res.status(404).json({
                        success: false,
                        error: error.message
                    });
                }
                throw error;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logError(errorMessage, 'ClassController.deleteClass');
            return res.status(500).json({
                success: false,
                error: 'Failed to delete class'
            });
        }
    }
}
