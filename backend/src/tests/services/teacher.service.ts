import { Database } from 'sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { 
    ServiceResult, 
    PaginatedResult,
    ServiceError,
    createUUID,
    createEmail,
    createPhoneNumber
} from '../../types/common.types';
import { 
    Teacher, 
    CreateTeacherData,
    UpdateTeacherData,
    TeacherNotFoundError,
    DuplicateTeacherError,
} from '../../services/teacher.service';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas - same as production
const TeacherSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(100),
    employeeId: z.string().min(3).max(20),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[\d\s-()]{10,}$/),
    subjects: z.array(z.string()),
    joinDate: z.string().datetime(),
    status: z.enum(['active', 'inactive']).default('active'),
    createdAt: z.date(),
    updatedAt: z.date(),
    class: z.string().optional()
});

interface TeacherFilters {
    status?: 'active' | 'inactive';
    search?: string;  // Will match against name, email, or employeeId
    class?: string;
    page?: number;
    limit?: number;
}

interface GetTeacherIdentifier {
    id?: string;
    employeeId?: string;
    email?: string;
    name?: string;
}

export class TeacherTestService {
    private static instance: TeacherTestService;
    private db: Database | null = null;

    private constructor() {}

    static getInstance(): TeacherTestService {
        if (!TeacherTestService.instance) {
            TeacherTestService.instance = new TeacherTestService();
        }
        return TeacherTestService.instance;
    }

    private validateFilters(filters: TeacherFilters): void {
        if (filters.status) {
            z.enum(['active', 'inactive']).parse(filters.status);
        }
        if (filters.page) {
            z.number().positive().parse(filters.page);
        }
        if (filters.limit) {
            z.number().positive().max(100).parse(filters.limit);
        }
    }

    private async getSubjectIdsByNames(subjectNames: string[]): Promise<string[]> {
        if (!this.db) throw new Error('Database not initialized');

        const placeholders = subjectNames.map(() => '?').join(',');
        const query = `
            SELECT id, name 
            FROM subjects 
            WHERE name IN (${placeholders})
        `;

        const rows = await this.db.all(query, subjectNames);
        
        if (rows.length !== subjectNames.length) {
            const foundNames = rows.map((row: { name: string }) => row.name);
            const notFound = subjectNames.filter(name => !foundNames.includes(name));
            throw new ServiceError(`Some subjects not found: ${notFound.join(', ')}`, 'SUBJECTS_NOT_FOUND');
        }

        return rows.map((row: { id: string }) => row.id);
    }

    private async getClassIdByName(className: string): Promise<string> {
        if (!this.db) throw new Error('Database not initialized');

        const { id } = await this.db.get(
            'SELECT id FROM classes WHERE name = ?',
            className
        ) || {};
        
        if (!id) {
            throw new ServiceError(`Class not found: ${className}`, 'CLASS_NOT_FOUND');
        }

        return id;
    }

    private async checkTeacherDuplicates(email: string, employeeId: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        // Check for duplicate email
        const existingEmail = await this.db.get(
          'SELECT email FROM teachers WHERE email = ?',
          [email]
        );
        if (existingEmail) {
          throw new DuplicateTeacherError('email');
        }

        // Check for duplicate employee ID
        const existingEmployeeId = await this.db.get(
          'SELECT employee_id FROM teachers WHERE employee_id = ?',
          [employeeId]
        );
        if (existingEmployeeId) {
          throw new DuplicateTeacherError('employee ID');
        }
    }

    async initialize(): Promise<void> {
        this.db = await open({
            filename: ':memory:',
            driver: sqlite3.Database
        });

        // Create teachers table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS teachers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                employee_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                join_date TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        // Create subjects table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS subjects (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            )
        `);

        // Create classes table
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS classes (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL
            )
        `);

        // Create junction tables
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS teacher_subjects (
                teacher_id TEXT NOT NULL,
                subject_id TEXT NOT NULL,
                PRIMARY KEY (teacher_id, subject_id),
                FOREIGN KEY (teacher_id) REFERENCES teachers(id),
                FOREIGN KEY (subject_id) REFERENCES subjects(id)
            )
        `);

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS class_teachers (
                teacher_id TEXT NOT NULL,
                class_id TEXT NOT NULL,
                is_primary BOOLEAN DEFAULT false,
                PRIMARY KEY (teacher_id, class_id),
                FOREIGN KEY (teacher_id) REFERENCES teachers(id),
                FOREIGN KEY (class_id) REFERENCES classes(id)
            )
        `);

        // Add sample subjects
        const sampleSubjects = [
            { id: crypto.randomUUID(), name: 'Mathematics' },
            { id: crypto.randomUUID(), name: 'Physics' },
            { id: crypto.randomUUID(), name: 'Chemistry' },
            { id: crypto.randomUUID(), name: 'Biology' },
            { id: crypto.randomUUID(), name: 'English' }
        ];

        for (const subject of sampleSubjects) {
            await this.db.run(
                'INSERT INTO subjects (id, name) VALUES (?, ?)',
                [subject.id, subject.name]
            );
        }

        // Add sample classes
        const sampleClasses = [
            { id: crypto.randomUUID(), name: 'Form 1A' },
            { id: crypto.randomUUID(), name: 'Form 1B' },
            { id: crypto.randomUUID(), name: 'Form 2A' },
            { id: crypto.randomUUID(), name: 'Form 2B' },
            { id: crypto.randomUUID(), name: 'Form 3A' }
        ];

        for (const class_ of sampleClasses) {
            await this.db.run(
                'INSERT INTO classes (id, name) VALUES (?, ?)',
                [class_.id, class_.name]
            );
        }
    }

    async getTeacherByIdentifier(identifier: GetTeacherIdentifier): Promise<ServiceResult<Teacher>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            if (!identifier.id && !identifier.employeeId && !identifier.email && !identifier.name) {
                throw new Error('At least one identifier (id, employeeId, email, or name) must be provided');
            }

            const query = `
                SELECT 
                    t.*,
                    GROUP_CONCAT(DISTINCT s.name) as subject_names,
                    (
                        SELECT c.name 
                        FROM class_teachers ct 
                        JOIN classes c ON ct.class_id = c.id 
                        WHERE ct.teacher_id = t.id AND ct.is_primary = 1
                        LIMIT 1
                    ) as class_name
                FROM teachers t
                LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
                LEFT JOIN subjects s ON ts.subject_id = s.id
                WHERE 1=1
            `;

            const conditions: string[] = [];
            const values: any[] = [];

            if (identifier.id) {
                conditions.push('t.id = ?');
                values.push(identifier.id);
            }
            if (identifier.employeeId) {
                conditions.push('t.employee_id = ?');
                values.push(identifier.employeeId);
            }
            if (identifier.email) {
                conditions.push('t.email = ?');
                values.push(identifier.email);
            }
            if (identifier.name) {
                conditions.push('t.name = ?');
                values.push(identifier.name);
            }

            const finalQuery = `${query} AND ${conditions.join(' AND ')} GROUP BY t.id`;
            const row = await this.db.get(finalQuery, values);

            if (!row) {
                const identifierValue = identifier.id || identifier.employeeId || identifier.email || identifier.name || 'unknown';
                throw new TeacherNotFoundError(identifierValue);
            }

            const teacher = {
                ...row,
                subjects: row.subject_names ? row.subject_names.split(',') : [],
                class: row.class_name || null
            };

            return { success: true, data: teacher };
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Unknown error occurred');
        }
    }

    async createTeacher(data: CreateTeacherData): Promise<ServiceResult<Teacher>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.db.run('BEGIN TRANSACTION');

            // Validate data
            const validatedData = {
                ...data,
                email: createEmail(data.email),
                phone: createPhoneNumber(data.phone),
            };

            // Check for duplicates
            await this.checkTeacherDuplicates(validatedData.email, validatedData.employeeId);

            const id = crypto.randomUUID();

            // 1. Create teacher record
            await this.db.run(`
                INSERT INTO teachers (
                    id,
                    name,
                    email,
                    phone,
                    employee_id,
                    join_date,
                    status,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                validatedData.name,
                validatedData.email,
                validatedData.phone,
                validatedData.employeeId,
                validatedData.joinDate,
                'active',
                new Date().toISOString(),
                new Date().toISOString()
            ]);

            // 2. Link teacher to subjects
            if (data.subjects && data.subjects.length > 0) {
                const subjectIds = await this.getSubjectIdsByNames(data.subjects);
                for (const subjectId of subjectIds) {
                    await this.db.run(`
                        INSERT INTO teacher_subjects (teacher_id, subject_id)
                        VALUES (?, ?)
                    `, [id, subjectId]);
                }
            }

            // 3. Link teacher to class if provided
            if (data.class) {
                const classId = await this.getClassIdByName(data.class);
                await this.db.run(`
                    INSERT INTO class_teachers (teacher_id, class_id, is_primary)
                    VALUES (?, ?, ?)
                `, [id, classId, true]);
            }

            await this.db.run('COMMIT');

            return await this.getTeacherByIdentifier({ id });
        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }

    async getTeachers(filters: TeacherFilters = {}): Promise<PaginatedResult<Teacher[]>> {
        if (!this.db) throw new Error('Database not initialized');

        this.validateFilters(filters);

        try {
            const page = filters.page || 1;
            const limit = filters.limit || 10;
            const offset = (page - 1) * limit;

            let baseQuery = `
                SELECT 
                    t.*,
                    GROUP_CONCAT(DISTINCT s.name) as subject_names,
                    (
                        SELECT c.name 
                        FROM class_teachers ct 
                        JOIN classes c ON ct.class_id = c.id 
                        WHERE ct.teacher_id = t.id AND ct.is_primary = 1
                        LIMIT 1
                    ) as class_name
                FROM teachers t
                LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
                LEFT JOIN subjects s ON ts.subject_id = s.id
                WHERE 1=1
            `;

            const params: any[] = [];

            if (filters.status) {
                baseQuery += ' AND t.status = ?';
                params.push(filters.status);
            }

            if (filters.search) {
                baseQuery += ` AND (
                    t.name LIKE ? OR 
                    t.email LIKE ? OR 
                    t.employee_id LIKE ?
                )`;
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (filters.class) {
                baseQuery += ` AND EXISTS (
                    SELECT 1 FROM class_teachers ct2
                    JOIN classes c2 ON ct2.class_id = c2.id
                    WHERE ct2.teacher_id = t.id AND c2.name = ?
                )`;
                params.push(filters.class);
            }

            // Add GROUP BY before pagination
            baseQuery += ' GROUP BY t.id';

            // Get total count
            const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) as subquery`;
            const { count } = await this.db.get(countQuery, params);
            const total = count;

            // Add pagination
            baseQuery += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const rows = await this.db.all(baseQuery, params);

            const teachers = rows.map(row => ({
                ...row,
                subjects: row.subject_names ? row.subject_names.split(',') : [],
                class: row.class_name || null
            }));

            return {
                data: teachers,
                total,
                page,
                limit
            };
        } catch (error) {
            console.error('Error in getTeachers:', error);
            throw error;
        }
    }

    async updateTeacher(id: string, data: UpdateTeacherData): Promise<ServiceResult<Teacher>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.db.run('BEGIN TRANSACTION');

            // Check if teacher exists
            await this.getTeacherByIdentifier({ id });

            // 1. Update basic teacher info
            const updates: string[] = [];
            const values: any[] = [];

            if (data.name) {
                updates.push('name = ?');
                values.push(data.name);
            }
            if (data.email) {
                updates.push('email = ?');
                values.push(createEmail(data.email));
            }
            if (data.phone) {
                updates.push('phone = ?');
                values.push(createPhoneNumber(data.phone));
            }
            if (data.employeeId) {
                updates.push('employee_id = ?');
                values.push(data.employeeId);
            }
            if (data.joinDate) {
                updates.push('join_date = ?');
                values.push(data.joinDate);
            }
            if (data.status) {
                updates.push('status = ?');
                values.push(data.status);
            }

            updates.push('updated_at = ?');
            values.push(new Date().toISOString());

            if (updates.length > 0) {
                values.push(id);
                await this.db.run(
                    `UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            // 2. Update subjects if provided
            if (data.subjects) {
                // Remove existing subject relationships
                await this.db.run('DELETE FROM teacher_subjects WHERE teacher_id = ?', id);

                // Add new subject relationships
                if (data.subjects.length > 0) {
                    const subjectIds = await this.getSubjectIdsByNames(data.subjects);
                    for (const subjectId of subjectIds) {
                        await this.db.run(`
                            INSERT INTO teacher_subjects (teacher_id, subject_id)
                            VALUES (?, ?)
                        `, [id, subjectId]);
                    }
                }
            }

            // 3. Update class if provided
            if (data.class !== undefined) {
                // Remove existing class relationship
                await this.db.run('DELETE FROM class_teachers WHERE teacher_id = ?', id);

                // Add new class relationship if class is provided (not null)
                if (data.class) {
                    const classId = await this.getClassIdByName(data.class);
                    await this.db.run(`
                        INSERT INTO class_teachers (teacher_id, class_id, is_primary)
                        VALUES (?, ?, ?)
                    `, [id, classId, true]);
                }
            }

            await this.db.run('COMMIT');
            return await this.getTeacherByIdentifier({ id });

        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }

    async deleteTeacher(id: string): Promise<ServiceResult<null>> {
        if (!this.db) throw new Error('Database not initialized');

        try {
            await this.db.run('BEGIN TRANSACTION');

            // Check if teacher exists
            const existingTeacher = await this.db.get('SELECT id FROM teachers WHERE id = ?', id);
            if (!existingTeacher) {
                throw new TeacherNotFoundError(id);
            }

            // Delete from junction tables first
            await this.db.run('DELETE FROM teacher_subjects WHERE teacher_id = ?', id);
            await this.db.run('DELETE FROM class_teachers WHERE teacher_id = ?', id);
            
            // Delete teacher
            await this.db.run('DELETE FROM teachers WHERE id = ?', id);

            await this.db.run('COMMIT');
            return { success: true, data: null };

        } catch (error) {
            await this.db.run('ROLLBACK');
            throw error;
        }
    }

    async getDatabase(): Promise<Database> {
        if (!this.db) throw new Error('Database not initialized');
        return this.db;
    }
}

export const teacherTestService = TeacherTestService.getInstance();