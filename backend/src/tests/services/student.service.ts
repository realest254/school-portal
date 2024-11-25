import { Database } from 'sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { 
    ServiceResult, 
    PaginatedResult,
    ServiceError,
    createEmail,
    createPhoneNumber
} from '../../types/common.types';
import crypto from 'crypto';
import { 
    StudentNotFoundError,
    DuplicateStudentError,
    Student
} from '../../services/student.service';
import { z } from 'zod';

interface StudentFilters {
    status?: 'active' | 'inactive';
    class?: string;
    search?: string;
    page?: number;
    limit?: number;
}

interface GetStudentIdentifier {
    id?: string;
    studentId?: string;
    email?: string;
}

export class StudentTestService {
    private static instance: StudentTestService;
    private db: Database | null = null;

    private constructor() {}

    static getInstance(): StudentTestService {
        if (!StudentTestService.instance) {
            StudentTestService.instance = new StudentTestService();
        }
        return StudentTestService.instance;
    }

    private static validateFilters(filters: StudentFilters): void {
        if (filters.status) {
            z.enum(['active', 'inactive']).parse(filters.status);
        }
        if (filters.class) {
            z.string().min(1).max(20).parse(filters.class);
        }
        if (filters.search) {
            z.string().max(100).parse(filters.search);
        }
        if (filters.page) {
            z.number().positive().parse(filters.page);
        }
        if (filters.limit) {
            z.number().positive().max(100).parse(filters.limit);
        }
    }

    private async getClassIdByName(className: string): Promise<string> {
        if (!this.db) throw new Error('Database not initialized');

        const row = await this.db.get(
            'SELECT id FROM classes WHERE name = ?',
            [className]
        );
        
        if (!row) {
            throw new ServiceError(`Class not found: ${className}`, 'CLASS_NOT_FOUND');
        }

        return row.id;
    }

    private async checkStudentDuplicates(email: string, studentId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Check for duplicate email
        const existingEmail = await this.db.get(
            'SELECT email FROM students WHERE email = ?',
            [email]
        );
        if (existingEmail) {
            throw new DuplicateStudentError('email');
        }

        // Check for duplicate student ID
        const existingStudentId = await this.db.get(
            'SELECT admission_number FROM students WHERE admission_number = ?',
            [studentId]
        );
        if (existingStudentId) {
            throw new DuplicateStudentError('student ID');
        }
    }

    async initialize(): Promise<void> {
        this.db = await open({
            filename: ':memory:',
            driver: sqlite3.Database
        });

        // Create tables
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS classes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 12),
                stream TEXT,
                academic_year INTEGER NOT NULL CHECK (academic_year BETWEEN 2000 AND 2100),
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                admission_number TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                parent_phone TEXT NOT NULL,
                dob DATETIME NOT NULL,
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS class_students (
                student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
                class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
                enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (student_id, class_id)
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
            CREATE INDEX IF NOT EXISTS idx_students_admission_number ON students(admission_number);
            CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
            CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
            CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);
            CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
        `);
    }

    async getStudents(filters: StudentFilters = {}): Promise<PaginatedResult<Student[]>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            StudentTestService.validateFilters(filters);

            let query = `
                SELECT 
                    s.*,
                    c.name as class_name
                FROM students s
                LEFT JOIN class_students cs ON s.id = cs.student_id
                LEFT JOIN classes c ON cs.class_id = c.id
                WHERE 1=1
            `;
            const params: any[] = [];

            if (filters.status) {
                query += ' AND s.status = ?';
                params.push(filters.status);
            }

            if (filters.search) {
                query += ` AND (
                    s.name LIKE ? OR
                    s.email LIKE ? OR
                    s.admission_number LIKE ?
                )`;
                const searchPattern = `%${filters.search}%`;
                params.push(searchPattern, searchPattern, searchPattern);
            }

            if (filters.class) {
                query += ' AND c.name = ?';
                params.push(filters.class);
            }

            // Add ordering
            query += ' ORDER BY s.name';

            // Get total count
            const countQuery = `SELECT COUNT(*) as count FROM (${query})`;
            const { count } = await this.db.get(countQuery, params);

            // Add pagination
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const offset = (page - 1) * limit;
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rows = await this.db.all(query, params);

            if (rows.length === 0 && filters.class) {
                throw new ServiceError(`No students found in class: ${filters.class}`, 'NO_STUDENTS_FOUND', 404);
            }

            const students = rows.map(row => ({
                ...row,
                class: row.class_name
            }));

            return {
                data: students,
                total: count,
                page,
                limit
            };
        } catch (error) {
            if (error instanceof ServiceError) throw error;
            throw new ServiceError('Failed to fetch students', 'FETCH_ERROR');
        }
    }

    async getStudentByIdentifier(identifier: GetStudentIdentifier): Promise<ServiceResult<Student>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            let query = `
                SELECT 
                    s.*,
                    c.name as class_name
                FROM students s
                LEFT JOIN class_students cs ON s.id = cs.student_id
                LEFT JOIN classes c ON cs.class_id = c.id
                WHERE 1=0
            `;
            const params: any[] = [];

            if (identifier.id) {
                query += ' OR s.id = ?';
                params.push(identifier.id);
            }
            if (identifier.studentId) {
                query += ' OR s.admission_number = ?';
                params.push(identifier.studentId);
            }
            if (identifier.email) {
                query += ' OR s.email = ?';
                params.push(identifier.email);
            }

            const row = await this.db.get(query, params);

            if (!row) {
                throw new StudentNotFoundError(Object.values(identifier)[0]);
            }

            const student = {
                ...row,
                class: row.class_name
            };

            return { success: true, data: student };
        } catch (error) {
            if (error instanceof StudentNotFoundError) throw error;
            throw new ServiceError('Failed to fetch student', 'FETCH_ERROR');
        }
    }

    async createStudent(data: {
        name: string;
        studentId: string;
        email: string;
        class: string;
        parentPhone: string;
        dob: string;
    }): Promise<ServiceResult<Student>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.db.run('BEGIN TRANSACTION');

            // Validate data
            const validatedData = {
                ...data,
                email: createEmail(data.email),
                parentPhone: createPhoneNumber(data.parentPhone),
            };

            // Check for duplicates
            await this.checkStudentDuplicates(validatedData.email, validatedData.studentId);

            // Get class ID
            const classId = await this.getClassIdByName(data.class);

            // 1. Create student record
            const id = crypto.randomUUID();
            await this.db.run(`
                INSERT INTO students (
                    id, name, admission_number, email, parent_phone, dob, status
                ) VALUES (?, ?, ?, ?, ?, ?, 'active')
            `, [
                id,
                validatedData.name,
                validatedData.studentId,
                validatedData.email,
                validatedData.parentPhone,
                validatedData.dob
            ]);

            // 2. Link student to class
            await this.db.run(`
                INSERT INTO class_students (student_id, class_id)
                VALUES (?, ?)
            `, [id, classId]);

            await this.db.run('COMMIT');

            return await this.getStudentByIdentifier({ id });
        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }

    async updateStudent(id: string, data: {
        name?: string;
        studentId?: string;
        email?: string;
        class?: string;
        parentPhone?: string;
        dob?: string;
        status?: 'active' | 'inactive';
    }): Promise<ServiceResult<Student>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.db.run('BEGIN TRANSACTION');

            // Check if student exists
            await this.getStudentByIdentifier({ id });

            // Check for duplicates if email or student ID is being updated
            if (data.email || data.studentId) {
                const duplicateCheck = await this.getStudentByIdentifier({
                    email: data.email,
                    studentId: data.studentId
                }).catch(() => null);

                if (duplicateCheck?.data && duplicateCheck.data.id !== id) {
                    throw new DuplicateStudentError(
                        duplicateCheck.data.email === data.email ? 'email' : 'student ID'
                    );
                }
            }

            // 1. Update basic student info
            const updateParts: string[] = [];
            const updateValues: any[] = [];

            if (data.name) {
                updateParts.push('name = ?');
                updateValues.push(data.name);
            }
            if (data.studentId) {
                updateParts.push('admission_number = ?');
                updateValues.push(data.studentId);
            }
            if (data.email) {
                updateParts.push('email = ?');
                updateValues.push(createEmail(data.email));
            }
            if (data.parentPhone) {
                updateParts.push('parent_phone = ?');
                updateValues.push(createPhoneNumber(data.parentPhone));
            }
            if (data.dob) {
                updateParts.push('dob = ?');
                updateValues.push(data.dob);
            }
            if (data.status) {
                updateParts.push('status = ?');
                updateValues.push(data.status);
            }

            if (updateParts.length > 0) {
                updateValues.push(id);
                await this.db.run(
                    `UPDATE students SET ${updateParts.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }

            // 2. Update class if provided
            if (data.class) {
                const classId = await this.getClassIdByName(data.class);
                
                // Remove existing class relationship
                await this.db.run(
                    'DELETE FROM class_students WHERE student_id = ?',
                    [id]
                );

                // Add new class relationship
                await this.db.run(
                    'INSERT INTO class_students (student_id, class_id) VALUES (?, ?)',
                    [id, classId]
                );
            }

            await this.db.run('COMMIT');

            return await this.getStudentByIdentifier({ id });
        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }

    async deleteStudent(id: string): Promise<ServiceResult<null>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            // Check if student exists
            await this.getStudentByIdentifier({ id });

            await this.db.run('DELETE FROM students WHERE id = ?', [id]);

            return { success: true, data: null };
        } catch (error) {
            if (error instanceof StudentNotFoundError) throw error;
            throw new ServiceError('Failed to delete student', 'DELETE_ERROR');
        }
    }

    async getDatabase(): Promise<Database> {
        if (!this.db) throw new Error('Database not initialized');
        return this.db;
    }
}

export const studentTestService = StudentTestService.getInstance();
