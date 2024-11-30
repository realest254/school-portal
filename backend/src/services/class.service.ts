import { Pool } from 'pg';
import pool from '../db';
import SQL from 'sql-template-strings';
import { 
    ServiceResult, 
    ServiceError,
    UUID,
    createUUID
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
class ClassNotFoundError extends ServiceError {
    constructor(identifier: string) {
        super(`Class not found: ${identifier}`, 'CLASS_NOT_FOUND', 404);
    }
}

class DuplicateClassError extends ServiceError {
    constructor(name: string, academicYear: number) {
        super(`Class with name ${name} already exists for academic year ${academicYear}`, 'DUPLICATE_CLASS', 409);
    }
}

class ClassHasStudentsError extends ServiceError {
    constructor(id: string) {
        super(`Cannot delete class that has students assigned to it: ${id}`, 'CLASS_HAS_STUDENTS', 400);
    }
}

export class ClassService {
    private db: Pool;

    constructor() {
        this.db = pool;
    }

    async create(data: CreateClassData): Promise<ServiceResult<Class>> {
        try {
            const id = createUUID(uuidv4());
            const now = new Date();

            const classData = {
                id,
                ...data,
                isActive: true,
                createdAt: now,
                updatedAt: now
            };

            // Validate input
            ClassSchema.parse(classData);

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
            return { success: true, data: this.mapToClass(newClass) };
        } catch (error: any) {
            if (error.code === '23505') {
                throw new DuplicateClassError(data.name, data.academicYear);
            }
            throw error;
        }
    }

    async update(id: string, data: UpdateClassData): Promise<ServiceResult<Class>> {
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
                return { success: true, data: this.mapToClass(existingClass.rows[0]) };
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

            return { success: true, data: this.mapToClass(updatedClass) };
        } catch (error: any) {
            if (error.code === '23505') {
                throw new DuplicateClassError(data.name!, data.academicYear!);
            }
            throw error;
        }
    }

    async delete(id: string): Promise<ServiceResult<null>> {
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

            return { success: true, data: null };
        } catch (error: any) {
            throw error;
        }
    }

    async getById(id: string): Promise<ServiceResult<Class>> {
        try {
            const query = SQL`
                SELECT *
                FROM classes
                WHERE id = ${id}
            `;

            const { rows: [class_] } = await this.db.query(query);
            
            if (!class_) {
                throw new ClassNotFoundError(id);
            }

            return { success: true, data: this.mapToClass(class_) };
        } catch (error: any) {
            throw error;
        }
    }

    async getAll(filters: ClassFilters = {}): Promise<ServiceResult<Class[]>> {
        try {
            let query = SQL`
                SELECT *
                FROM classes
                WHERE 1=1
            `;

            if (filters.grade) {
                query.append(SQL` AND grade = ${filters.grade}`);
            }
            if (filters.academicYear) {
                query.append(SQL` AND academic_year = ${filters.academicYear}`);
            }
            if (filters.isActive !== undefined) {
                query.append(SQL` AND is_active = ${filters.isActive}`);
            }

            query.append(SQL` ORDER BY grade ASC, name ASC`);

            // Add pagination if specified
            if (filters.page !== undefined && filters.limit !== undefined) {
                const offset = (filters.page - 1) * filters.limit;
                query.append(SQL` LIMIT ${filters.limit} OFFSET ${offset}`);
            }

            const { rows } = await this.db.query(query);
            return { success: true, data: rows.map(this.mapToClass) };
        } catch (error: any) {
            throw error;
        }
    }

    private mapToClass(row: any): Class {
        return {
            id: row.id,
            name: row.name,
            grade: row.grade,
            stream: row.stream,
            academicYear: row.academic_year,
            isActive: Boolean(row.is_active),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}
