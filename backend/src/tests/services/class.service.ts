import { Database } from 'sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { 
    ServiceResult, 
    ServiceError
} from '../../types/common.types';
import { z } from 'zod';

// Validation schemas
const ClassInputSchema = z.object({
    name: z.string().min(1, { message: "Class name cannot be empty" }),
    grade: z.number().int().min(1, { message: "Grade must be at least 1" }).max(12, { message: "Grade cannot be higher than 12" }),
    stream: z.string().optional(),
    academicYear: z.number().int().min(2000, { message: "Academic year must be 2000 or later" }).max(2100, { message: "Academic year cannot be after 2100" }),
});

const ClassSchema = ClassInputSchema.extend({
    id: z.string().uuid(),
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

// Error classes specific to the test service
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

export class ClassService {
    private static instance: ClassService;
    private db: Database | null = null;

    private constructor() {}

    static getInstance(): ClassService {
        if (!ClassService.instance) {
            ClassService.instance = new ClassService();
        }
        return ClassService.instance;
    }

    private async getDatabase(): Promise<Database> {
        if (!this.db) {
            this.db = await open({
                filename: ':memory:',
                driver: sqlite3.Database
            });
            await this.initialize();
        }
        return this.db;
    }

    private async initialize(): Promise<void> {
        const db = await this.getDatabase();
        
        // Create classes table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS classes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                grade INTEGER NOT NULL,
                stream TEXT,
                academic_year INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, academic_year)
            )
        `);

        // Create class_teachers junction table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS class_teachers (
                class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
                teacher_id TEXT,
                is_primary BOOLEAN DEFAULT true,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (class_id, teacher_id)
            )
        `);

        // Create class_students junction table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS class_students (
                class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
                student_id TEXT,
                enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (class_id, student_id)
            )
        `);

        // Create class_subjects junction table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS class_subjects (
                class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
                subject_id TEXT,
                teacher_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (class_id, subject_id)
            )
        `);
    }

    async create(data: CreateClassData): Promise<ServiceResult<Class>> {
        try {
            const db = await this.getDatabase();
            
            // Validate input first
            const validationResult = ClassInputSchema.safeParse(data);
            if (!validationResult.success) {
                throw new ServiceError(
                    validationResult.error.errors[0].message,
                    'VALIDATION_ERROR',
                    400
                );
            }

            const id = uuidv4();
            const now = new Date();

            const classData = {
                id,
                ...data,
                isActive: true,
                createdAt: now,
                updatedAt: now
            };

            await db.run(
                `INSERT INTO classes (id, name, grade, stream, academic_year, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, data.name, data.grade, data.stream, data.academicYear, true, now.toISOString(), now.toISOString()]
            );

            const newClass = await db.get('SELECT * FROM classes WHERE id = ?', id);
            return { success: true, data: this.mapToClass(newClass) };
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                throw new DuplicateClassError(data.name, data.academicYear);
            }
            if (error instanceof ServiceError) {
                throw error;
            }
            throw new ServiceError(
                'Failed to create class',
                'INTERNAL_ERROR',
                500
            );
        }
    }

    async update(id: string, data: UpdateClassData): Promise<ServiceResult<Class>> {
        try {
            const db = await this.getDatabase();

            const existingClass = await db.get('SELECT * FROM classes WHERE id = ?', id);
            if (!existingClass) {
                throw new ClassNotFoundError(id);
            }

            const updates: string[] = [];
            const values: any[] = [];

            if (data.name !== undefined) {
                updates.push('name = ?');
                values.push(data.name);
            }
            if (data.grade !== undefined) {
                updates.push('grade = ?');
                values.push(data.grade);
            }
            if (data.stream !== undefined) {
                updates.push('stream = ?');
                values.push(data.stream);
            }
            if (data.academicYear !== undefined) {
                updates.push('academic_year = ?');
                values.push(data.academicYear);
            }
            if (data.isActive !== undefined) {
                updates.push('is_active = ?');
                values.push(data.isActive);
            }

            updates.push('updated_at = ?');
            values.push(new Date().toISOString());

            values.push(id);

            await db.run(
                `UPDATE classes SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            const updatedClass = await db.get('SELECT * FROM classes WHERE id = ?', id);
            return { success: true, data: this.mapToClass(updatedClass) };
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                throw new DuplicateClassError(data.name!, data.academicYear!);
            }
            throw error;
        }
    }

    async delete(id: string): Promise<ServiceResult<boolean>> {
        try {
            const db = await this.getDatabase();

            // First check if the class exists
            const existingClass = await db.get('SELECT * FROM classes WHERE id = ?', id);
            if (!existingClass) {
                throw new ClassNotFoundError(id);
            }

            await db.run('DELETE FROM classes WHERE id = ?', id);
            
            return { success: true, data: true };
        } catch (error: any) {
            if (error instanceof ServiceError) {
                throw error;
            }
            throw new ServiceError(
                'Failed to delete class',
                'DELETE_FAILED',
                500
            );
        }
    }

    async getById(id: string): Promise<ServiceResult<Class>> {
        const db = await this.getDatabase();

        const class_ = await db.get('SELECT * FROM classes WHERE id = ?', id);
        if (!class_) {
            throw new ClassNotFoundError(id);
        }

        return { success: true, data: this.mapToClass(class_) };
    }

    async getAll(filters: ClassFilters = {}): Promise<ServiceResult<Class[]>> {
        const db = await this.getDatabase();

        const conditions: string[] = [];
        const values: any[] = [];

        if (filters.grade !== undefined) {
            conditions.push('grade = ?');
            values.push(filters.grade);
        }
        if (filters.academicYear !== undefined) {
            conditions.push('academic_year = ?');
            values.push(filters.academicYear);
        }
        if (filters.isActive !== undefined) {
            conditions.push('is_active = ?');
            values.push(filters.isActive);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        // Add pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const offset = (page - 1) * limit;
        
        const query = `
            SELECT * FROM classes 
            ${whereClause} 
            ORDER BY created_at 
            LIMIT ? OFFSET ?
        `;
        values.push(limit, offset);

        const classes = await db.all(query, values);

        return { 
            success: true, 
            data: classes.map(c => this.mapToClass(c))
        };
    }

    private mapToClass(row: any): Class {
        if (!row.created_at || !row.updated_at) {
            throw new ServiceError(
                'Invalid class data: missing timestamps',
                'INVALID_DATA',
                500
            );
        }
        
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

    // Helper methods for testing
    async __test_insertClassTeacher(classId: string, teacherId: string, isPrimary: boolean = true) {
        const db = await this.getDatabase();
        await db.run(
            'INSERT INTO class_teachers (class_id, teacher_id, is_primary) VALUES (?, ?, ?)',
            [classId, teacherId, isPrimary]
        );
    }

    async __test_insertClassStudent(classId: string, studentId: string) {
        const db = await this.getDatabase();
        await db.run(
            'INSERT INTO class_students (class_id, student_id) VALUES (?, ?)',
            [classId, studentId]
        );
    }

    async __test_insertClassSubject(classId: string, subjectId: string, teacherId: string) {
        const db = await this.getDatabase();
        await db.run(
            'INSERT INTO class_subjects (class_id, subject_id, teacher_id) VALUES (?, ?, ?)',
            [classId, subjectId, teacherId]
        );
    }
}

export const classService = ClassService.getInstance();
