import { Database } from 'sqlite3';
import { z } from 'zod';
import SQL from 'sql-template-strings';
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const UUIDSchema = z.string().uuid();
const StatusSchema = z.enum(['active', 'resolved', 'deleted']);
const SeveritySchema = z.enum(['minor', 'moderate', 'severe']);
const CreateIndisciplineSchema = z.object({
    studentAdmissionNumber: z.string().min(1),
    reporterEmail: z.string().email(),
    incident_date: z.date(),
    description: z.string().min(1),
    severity: SeveritySchema,
    action_taken: z.string().optional()
});

const UpdateIndisciplineSchema = z.object({
    studentAdmissionNumber: z.string().min(1).optional(),
    reporterEmail: z.string().email().optional(),
    incident_date: z.date().optional(),
    description: z.string().min(1).optional(),
    severity: SeveritySchema.optional(),
    status: StatusSchema.optional(),
    action_taken: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
});

const FilterSchema = z.object({
    student_id: UUIDSchema.optional(),
    severity: SeveritySchema.optional(),
    status: StatusSchema.optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional()
}).refine(
    data => {
        if (data.startDate && data.endDate) {
            return data.endDate >= data.startDate;
        }
        return true;
    },
    {
        message: "End date must be after start date",
        path: ["endDate"]
    }
);

interface Indiscipline {
    id: string;
    student_id: string;
    reported_by: string;
    incident_date: Date;
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    status: 'active' | 'resolved' | 'deleted';
    action_taken?: string;
    created_at: Date;
    updated_at: Date;
}

interface IndisciplineFilters {
    student_id?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
}

export class IndisciplineTestService {
    private static instance: IndisciplineTestService;
    private readonly db: Database;

    private constructor() {
        this.db = new Database(':memory:');
    }

    static getInstance(): IndisciplineTestService {
        if (!IndisciplineTestService.instance) {
            IndisciplineTestService.instance = new IndisciplineTestService();
        }
        return IndisciplineTestService.instance;
    }

    async initialize(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.db.serialize(() => {
                try {
                    // Create students table matching the schema
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS students (
                            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
                            admission_number TEXT UNIQUE NOT NULL,
                            name TEXT NOT NULL,
                            email TEXT NOT NULL UNIQUE,
                            parent_phone TEXT NOT NULL,
                            dob TEXT NOT NULL,
                            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                        )
                    `);

                    // Create teachers table matching the schema
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS teachers (
                            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
                            employee_id TEXT UNIQUE NOT NULL,
                            name TEXT NOT NULL,
                            email TEXT NOT NULL UNIQUE,
                            phone TEXT NOT NULL,
                            join_date TEXT NOT NULL,
                            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                        )
                    `);

                    // Create indiscipline table
                    this.db.run(`
                        CREATE TABLE IF NOT EXISTS indiscipline (
                            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
                            student_id TEXT NOT NULL,
                            reported_by TEXT NOT NULL,
                            incident_date TEXT NOT NULL,
                            description TEXT NOT NULL,
                            severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
                            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'deleted')),
                            action_taken TEXT,
                            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (student_id) REFERENCES students(id),
                            FOREIGN KEY (reported_by) REFERENCES teachers(id)
                        )
                    `);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async setupTestData(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Create a test student with all required fields
                this.db.run(
                    'INSERT INTO students (id, name, admission_number, email, parent_phone, dob, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['student1', 'John Doe', 'STU001', 'john@school.com', '1234567890', '2000-01-01', 'active']
                );

                // Create a test teacher with all required fields
                this.db.run(
                    'INSERT INTO teachers (id, employee_id, name, email, phone, join_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['teacher1', 'EMP001', 'Jane Smith', 'teacher@school.com', '1234567890', '2020-01-01', 'active']
                );
            });
            resolve();
        });
    }

    private validateFilters(filters: IndisciplineFilters) {
        if (!filters) return;
        
        const validationResult = FilterSchema.safeParse(filters);
        if (!validationResult.success) {
            throw new Error(`Invalid filters: ${validationResult.error.message}`);
        }
    }

    private async resolveStudentId(admissionNumber: string): Promise<string> {
        const row = await this.runQuery(
            'SELECT id FROM students WHERE admission_number = ? AND status = ?',
            [admissionNumber, 'active']
        );
        if (!row) {
            throw new Error(`Student with admission number ${admissionNumber} not found`);
        }
        return row.id;
    }

    private async resolveTeacherId(teacherEmail: string): Promise<string> {
        const row = await this.runQuery(
            'SELECT id FROM teachers WHERE email = ? AND status = ?',
            [teacherEmail, 'active']
        );
        if (!row) {
            throw new Error(`Teacher with email ${teacherEmail} not found`);
        }
        return row.id;
    }

    async create(data: {
        studentAdmissionNumber: string;
        reporterEmail: string;
        incident_date: Date;
        description: string;
        severity: 'minor' | 'moderate' | 'severe';
        action_taken?: string;
    }): Promise<Indiscipline> {
        return new Promise(async (resolve, reject) => {
            try {
                // Validate input data
                const validationResult = CreateIndisciplineSchema.safeParse(data);
                if (!validationResult.success) {
                    throw new Error(`Validation failed: ${validationResult.error.message}`);
                }

                await this.runTransaction(async () => {
                    // Resolve IDs from provided identifiers
                    const student_id = await this.resolveStudentId(data.studentAdmissionNumber);
                    const reported_by = await this.resolveTeacherId(data.reporterEmail);

                    const result = await this.runQuery(`
                        INSERT INTO indiscipline (
                            student_id, reported_by, incident_date, description, 
                            severity, status, action_taken
                        ) VALUES (?, ?, ?, ?, ?, 'active', ?)
                        RETURNING *
                    `, [
                        student_id,
                        reported_by,
                        data.incident_date.toISOString(),
                        data.description,
                        data.severity,
                        data.action_taken
                    ]);

                    resolve(this.mapIndisciplineRow(result));
                });
            } catch (error: any) {
                const message = error instanceof Error ? error.message : 'Failed to create indiscipline record';
                reject(new Error(`Failed to create indiscipline record: ${message}`));
            }
        });
    }

    async getAll(filters?: IndisciplineFilters): Promise<Indiscipline[]> {
        try {
            if (filters) {
                this.validateFilters(filters);
            }

            let query = 'SELECT * FROM indiscipline WHERE status != ?';
            const params: any[] = ['deleted'];

            if (filters) {
                if (filters.student_id) {
                    query += ' AND student_id = ?';
                    params.push(filters.student_id);
                }
                if (filters.severity) {
                    query += ' AND severity = ?';
                    params.push(filters.severity);
                }
                if (filters.status) {
                    query += ' AND status = ?';
                    params.push(filters.status);
                }
                if (filters.startDate) {
                    query += ' AND incident_date >= ?';
                    params.push(filters.startDate.toISOString());
                }
                if (filters.endDate) {
                    query += ' AND incident_date <= ?';
                    params.push(filters.endDate.toISOString());
                }
            }

            query += ' ORDER BY incident_date DESC';

            const rows = await this.runAll(query, params);
            return rows.map(row => this.mapIndisciplineRow(row));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch indiscipline records';
            throw new Error(`Failed to fetch indiscipline records: ${message}`);
        }
    }

    async getById(id: string): Promise<Indiscipline | null> {
        const row = await this.runQuery(
            'SELECT * FROM indiscipline WHERE id = ?',
            [id]
        );
        return row ? this.mapIndisciplineRow(row) : null;
    }

    async update(id: string, data: {
        studentAdmissionNumber?: string;
        reporterEmail?: string;
        incident_date?: Date;
        description?: string;
        severity?: 'minor' | 'moderate' | 'severe';
        status?: 'active' | 'resolved';
        action_taken?: string;
    }): Promise<Indiscipline> {
        try {
            // Validate update data
            const validationResult = UpdateIndisciplineSchema.safeParse(data);
            if (!validationResult.success) {
                throw new Error(`Validation failed: ${validationResult.error.message}`);
            }

            // Check if record exists
            const existingRecord = await this.getById(id);
            if (!existingRecord) {
                throw new Error('Indiscipline record not found');
            }

            const setClause = [];
            const values = [];

            // Build update query
            if (data.studentAdmissionNumber) {
                const student_id = await this.resolveStudentId(data.studentAdmissionNumber);
                setClause.push('student_id = ?');
                values.push(student_id);
            }

            if (data.reporterEmail) {
                const reported_by = await this.resolveTeacherId(data.reporterEmail);
                setClause.push('reported_by = ?');
                values.push(reported_by);
            }

            if (data.incident_date) {
                setClause.push('incident_date = ?');
                values.push(data.incident_date.toISOString());
            }

            if (data.description) {
                setClause.push('description = ?');
                values.push(data.description);
            }

            if (data.severity) {
                setClause.push('severity = ?');
                values.push(data.severity);
            }

            if (data.status) {
                setClause.push('status = ?');
                values.push(data.status);
            }

            if (data.action_taken) {
                setClause.push('action_taken = ?');
                values.push(data.action_taken);
            }

            if (setClause.length === 0) {
                throw new Error('At least one field must be provided for update');
            }

            setClause.push('updated_at = CURRENT_TIMESTAMP');

            // Add the ID to the values array
            values.push(id);

            const updateQuery = `
                UPDATE indiscipline 
                SET ${setClause.join(', ')}
                WHERE id = ?
                RETURNING *
            `;

            const updatedRow = await this.runQuery(updateQuery, values);
            if (!updatedRow) {
                throw new Error('Failed to update record');
            }

            return this.mapIndisciplineRow(updatedRow);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to update indiscipline record: ${message}`);
        }
    }

    private async runDelete(sql: string, params: any[] = []): Promise<{ changes: number }> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err: Error | null) {
                if (err) {
                    reject(new Error(`Database error: ${err.message}`));
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async delete(id: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const record = await this.getById(id);
                if (!record) {
                    throw new Error(`Record with id ${id} not found`);
                }

                const result = await this.runDelete(
                    'DELETE FROM indiscipline WHERE id = ?',
                    [id]
                );

                if (result.changes === 0) {
                    throw new Error(`Failed to delete record with id ${id}`);
                }
                resolve();
            } catch (error: any) {
                const message = error instanceof Error ? error.message : 'Failed to delete indiscipline record';
                reject(new Error(`Failed to delete indiscipline record: ${message}`));
            }
        });
    }

    async cleanup(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.runDelete('DELETE FROM indiscipline', []);
                await this.runDelete('DELETE FROM students', []);
                await this.runDelete('DELETE FROM teachers', []);
                resolve();
            } catch (error: any) {
                const message = error instanceof Error ? error.message : 'Failed to cleanup database';
                reject(new Error(`Failed to cleanup database: ${message}`));
            }
        });
    }

    private async runTransaction<T>(operation: () => Promise<T>): Promise<T> {
        let result: T;
        try {
            await this.runQuery('BEGIN TRANSACTION', []);
            result = await operation();
            await this.runQuery('COMMIT', []);
            return result;
        } catch (error) {
            try {
                await this.runQuery('ROLLBACK', []);
            } catch (rollbackError) {
                // Log rollback error but throw the original error
                console.error('Rollback failed:', rollbackError);
            }
            throw error;
        }
    }

    private async runQuery(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: Error | null, row: any) => {
                if (err) {
                    reject(new Error(`Database error: ${err.message}`));
                } else {
                    resolve(row);
                }
            });
        });
    }

    private async runAll(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(new Error(`Database error: ${err.message}`));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    private mapIndisciplineRow(row: any): Indiscipline {
        return {
            ...row,
            incident_date: new Date(row.incident_date),
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at)
        };
    }
}
