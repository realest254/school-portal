import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import { 
    ServiceResult, 
    ServiceError,
    UUID,
    createUUID,
    PaginatedResult
} from '../types/common.types';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const ClassSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    grade: z.number().int().min(1).max(12),
    stream: z.string().optional(),
    academicYear: z.number().int().min(2000).max(2100),
    isActive: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date()
});

export type Class = z.infer<typeof ClassSchema>;

interface CreateClassData {
    name: string;
    grade: number;
    stream?: string;
    academicYear: number;
}

interface UpdateClassData {
    name?: string;
    grade?: number;
    stream?: string;
    academicYear?: number;
    isActive?: boolean;
}

interface ClassFilters {
    grade?: number;
    academicYear?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

// Error classes specific to the service
export class ClassNotFoundError extends ServiceError {
    constructor(identifier: string) {
        super(`Class not found: ${identifier}`, 'CLASS_NOT_FOUND', 404);
    }
}

export class DuplicateClassError extends ServiceError {
    constructor(name: string, academicYear: number) {
        super(`Class with name ${name} already exists for academic year ${academicYear}`, 'DUPLICATE_CLASS', 409);
    }
}

export class ClassHasStudentsError extends ServiceError {
    constructor(id: string) {
        super(`Cannot delete class that has students assigned to it: ${id}`, 'CLASS_HAS_STUDENTS', 400);
    }
}

export class ClassService {
    private static instance: ClassService;
    private db: Pool;

    private constructor() {
        this.db = pool;
    }

    static getInstance(): ClassService {
        if (!ClassService.instance) {
            ClassService.instance = new ClassService();
        }
        return ClassService.instance;
    }

    private validateFilters(filters: ClassFilters): void {
        const filterSchema = z.object({
            grade: z.number().int().min(1).max(12).optional(),
            academicYear: z.number().int().min(2000).max(2100).optional(),
            isActive: z.boolean().optional(),
            page: z.number().int().min(1).optional(),
            limit: z.number().int().min(1).optional()
        });

        const result = filterSchema.safeParse(filters);
        if (!result.success) {
            throw new ServiceError(
                `Invalid filters: ${result.error.errors.map(e => e.message).join(', ')}`,
                'INVALID_FILTERS'
            );
        }
    }

    async create(data: CreateClassData): Promise<Class> {
        try {
            const validationResult = ClassSchema.omit({ 
                id: true, 
                createdAt: true, 
                updatedAt: true, 
                isActive: true 
            }).safeParse(data);

            if (!validationResult.success) {
                throw new ServiceError(
                    `Invalid class data: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
                    'VALIDATION_ERROR'
                );
            }

            const id = createUUID(uuidv4());
            const now = new Date();

            const classData = {
                id,
                ...data,
                isActive: true,
                createdAt: now,
                updatedAt: now
            };

            const query = SQL`
                INSERT INTO classes (
                    id, name, grade, stream, academic_year, is_active, created_at, updated_at
                )
                VALUES (
                    ${id}, ${data.name}, ${data.grade}, ${data.stream}, 
                    ${data.academicYear}, true, ${now}, ${now}
                )
                RETURNING *
            `;

            const { rows: [newClass] } = await this.db.query(query);
            return this.mapToClass(newClass);
        } catch (error: any) {
            if (error.code === '23505') {
                throw new DuplicateClassError(data.name, data.academicYear);
            }
            throw error;
        }
    }

    async update(id: string, data: UpdateClassData): Promise<Class> {
        try {
            const setClause = [];
            const values = [id];
            let paramCount = 2;

            if (data.name) {
                setClause.push(`name = $${paramCount++}`);
                values.push(data.name);
            }
            if (data.grade) {
                setClause.push(`grade = $${paramCount++}`);
                values.push(data.grade.toString());
            }
            if (data.stream !== undefined) {
                setClause.push(`stream = $${paramCount++}`);
                values.push(data.stream);
            }
            if (data.academicYear) {
                setClause.push(`academic_year = $${paramCount++}`);
                values.push(data.academicYear.toString());
            }
            if (data.isActive !== undefined) {
                setClause.push(`is_active = $${paramCount++}`);
                values.push(data.isActive.toString());
            }

            if (setClause.length === 0) {
                const existingClass = await this.db.query('SELECT * FROM classes WHERE id = $1', [id]);
                if (!existingClass.rows[0]) {
                    throw new ClassNotFoundError(id);
                }
                return this.mapToClass(existingClass.rows[0]);
            }

            setClause.push('updated_at = CURRENT_TIMESTAMP');

            const query = `
                UPDATE classes
                SET ${setClause.join(', ')}
                WHERE id = $1
                RETURNING *
            `;

            const { rows: [updatedClass] } = await this.db.query(query, values);
            
            if (!updatedClass) {
                throw new ClassNotFoundError(id);
            }

            return this.mapToClass(updatedClass);
        } catch (error: any) {
            if (error.code === '23505') {
                throw new DuplicateClassError(data.name!, data.academicYear!);
            }
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const query = SQL`
                DELETE FROM classes
                WHERE id = ${id}
                RETURNING *
            `;

            const { rows: [deletedClass] } = await this.db.query(query);
            
            if (!deletedClass) {
                throw new ClassNotFoundError(id);
            }
        } catch (error: any) {
            throw error;
        }
    }

    async getByName(name: string): Promise<Class> {
        try {
            const query = SQL`
                SELECT *
                FROM classes
                WHERE name = ${name}
                AND is_active = true
            `;

            const { rows: [class_] } = await this.db.query(query);
            
            if (!class_) {
                throw new ClassNotFoundError(name);
            }

            return this.mapToClass(class_);
        } catch (error: any) {
            throw error;
        }
    }

    async getAll(filters: ClassFilters = {}): Promise<PaginatedResult<Class[]>> {
        try {
            this.validateFilters(filters);

            // Build main query
            let query = SQL`
                SELECT *
                FROM classes
                WHERE 1=1
            `;

            // Build count query
            let countQuery = SQL`
                SELECT COUNT(*) as count
                FROM classes
                WHERE 1=1
            `;

            // Apply filters to both queries
            if (filters.grade) {
                const gradeFilter = SQL` AND grade = ${filters.grade}`;
                query.append(gradeFilter);
                countQuery.append(gradeFilter);
            }
            if (filters.academicYear) {
                const yearFilter = SQL` AND academic_year = ${filters.academicYear}`;
                query.append(yearFilter);
                countQuery.append(yearFilter);
            }
            if (filters.isActive !== undefined) {
                const activeFilter = SQL` AND is_active = ${filters.isActive}`;
                query.append(activeFilter);
                countQuery.append(activeFilter);
            }

            query.append(SQL` ORDER BY grade ASC, name ASC`);

            // Get total count first
            const { rows: [{ count }] } = await this.db.query(countQuery);

            // Add pagination
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const offset = (page - 1) * limit;
            query.append(SQL` LIMIT ${limit} OFFSET ${offset}`);

            // Get paginated data
            const { rows } = await this.db.query(query);

            return {
                data: rows.map(this.mapToClass),
                total: parseInt(count),
                page,
                limit
            };
        } catch (error: any) {
            throw error;
        }
    }

    private mapToClass(row: any): Class {
        try {
            return ClassSchema.parse({
                id: row.id,
                name: row.name,
                grade: Number(row.grade),
                stream: row.stream,
                academicYear: Number(row.academic_year),
                isActive: Boolean(row.is_active),
                createdAt: new Date(row.created_at),
                updatedAt: new Date(row.updated_at)
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new ServiceError(`Invalid class data in database: ${error.message}`, 'INVALID_DATA');
            }
            throw new ServiceError('Invalid class data in database', 'INVALID_DATA');
        }
    }
}

export const classService = ClassService.getInstance();
