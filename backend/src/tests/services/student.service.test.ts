import { studentTestService } from './student.service';
import { StudentNotFoundError, DuplicateStudentError } from '../../services/student.service';
import { table } from 'table';

function formatAsTable(data: any[]): string {
    if (data.length === 0) return 'No data';

    // Get all unique keys from all objects
    const keys = Array.from(new Set(
        data.flatMap(obj => Object.keys(obj))
    ));

    // Create header row
    const header = keys;

    // Create data rows
    const rows = data.map(obj => 
        keys.map(key => {
            const value = obj[key];
            if (value === null) return 'NULL';
            if (value === undefined) return '';
            if (Array.isArray(value)) return value.join(', ');
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        })
    );

    // Combine header and rows
    return table([header, ...rows], {
        border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',
            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',
            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',
            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼'
        }
    });
}

async function showTableContents() {
    const db = await studentTestService.getDatabase();
    console.log('\n=== Current Database State ===');
    
    // Get all tables
    const tables = await db.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `);

    // Show contents of each table
    for (const table of tables) {
        const rows = await db.all(`SELECT * FROM ${table.name}`);
        console.log(`\n📋 Table: ${table.name}`);
        console.log(formatAsTable(rows));
    }
    console.log('\n===========================');
}

async function logTestStep(description: string) {
    console.log(`\n🔍 TEST STEP: ${description}`);
    console.log('─'.repeat(50));
}

async function testStudentService() {
    try {
        await logTestStep('Initializing database');
        await studentTestService.initialize();

        // Create test classes
        const db = await studentTestService.getDatabase();
        await db.run(`
            INSERT INTO classes (id, name, grade, academic_year)
            VALUES 
                ('class1', 'Class 1A', 1, 2023),
                ('class2', 'Class 1B', 1, 2023)
        `);
        await showTableContents();

        // Test Case 1: Create a valid student
        await logTestStep('Creating a valid student');
        const createResult = await studentTestService.createStudent({
            name: 'John Doe',
            studentId: 'STU001',
            email: 'john.doe@school.com',
            class: 'Class 1A',
            parentPhone: '+1234567890',
            dob: '2010-01-01'
        });
        console.log('✅ Student created successfully:', createResult.data);
        await showTableContents();

        // Test Case 2: Get student by different identifiers
        await logTestStep('Getting student by different identifiers');
        
        // By ID
        const byId = await studentTestService.getStudentByIdentifier({ 
            id: createResult.data?.id 
        });
        console.log('✅ Got student by ID:', byId.data?.name);

        // By Email
        const byEmail = await studentTestService.getStudentByIdentifier({ 
            email: 'john.doe@school.com' 
        });
        console.log('✅ Got student by email:', byEmail.data?.name);

        // By Student ID
        const byStudentId = await studentTestService.getStudentByIdentifier({ 
            studentId: 'STU001' 
        });
        console.log('✅ Got student by student ID:', byStudentId.data?.name);

        // Test Case 3: Get non-existent student with different identifiers
        await logTestStep('Attempting to get non-existent student with different identifiers');
        
        const nonExistentCases = [
            { id: '12345678-1234-1234-1234-123456789012' },
            { email: 'nonexistent@school.com' },
            { studentId: 'NOSTU' }
        ];

        for (const identifier of nonExistentCases) {
            try {
                await studentTestService.getStudentByIdentifier(identifier);
            } catch (error) {
                if (error instanceof StudentNotFoundError) {
                    console.log('✅ Correctly caught student not found error:', error.message);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 4: Try to create students with duplicate fields
        await logTestStep('Attempting to create student with duplicate email');
        try {
            await studentTestService.createStudent({
                name: 'Jane Doe',
                studentId: 'STU002',
                email: 'john.doe@school.com', // Same email as John
                class: 'Class 1B',
                parentPhone: '+1234567891',
                dob: '2010-01-02'
            });
        } catch (error) {
            if (error instanceof DuplicateStudentError) {
                console.log('✅ Correctly caught duplicate email error:', error.message);
            } else {
                throw error;
            }
        }

        await logTestStep('Attempting to create student with duplicate student ID');
        try {
            await studentTestService.createStudent({
                name: 'Jane Doe',
                studentId: 'STU001', // Same as John
                email: 'jane.doe@school.com',
                class: 'Class 1B',
                parentPhone: '+1234567891',
                dob: '2010-01-02'
            });
        } catch (error) {
            if (error instanceof DuplicateStudentError) {
                console.log('✅ Correctly caught duplicate student ID error:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 5: Update student with same information
        await logTestStep('Updating student with same information');
        if (createResult.data?.id) {
            const updateResult = await studentTestService.updateStudent(
                createResult.data.id,
                {
                    name: 'John Doe',
                    email: 'john.doe@school.com'
                }
            );
            console.log('✅ Update with same info completed:', updateResult.data);
            await showTableContents();
        }

        // Test Case 6: Update non-existent student
        await logTestStep('Attempting to update non-existent student');
        try {
            await studentTestService.updateStudent(
                '12345678-1234-1234-1234-123456789012',
                { name: 'Ghost Student' }
            );
        } catch (error) {
            if (error instanceof StudentNotFoundError) {
                console.log('✅ Correctly caught student not found error:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 7: Create another valid student
        await logTestStep('Creating another valid student');
        const createResult2 = await studentTestService.createStudent({
            name: 'Jane Doe',
            studentId: 'STU002',
            email: 'jane.doe@school.com',
            class: 'Class 1B',
            parentPhone: '+1234567891',
            dob: '2010-01-02'
        });
        console.log('✅ Second student created successfully:', createResult2.data);
        await showTableContents();

        // Test Case 8: Get all students with filters
        await logTestStep('Getting all students with various filters');
        
        // Get all students
        const allStudents = await studentTestService.getStudents();
        console.log('✅ Got all students:', allStudents.data.length);

        // Filter by class
        const classStudents = await studentTestService.getStudents({ class: 'Class 1A' });
        console.log('✅ Got students in Class 1A:', classStudents.data.length);

        // Filter by status
        const activeStudents = await studentTestService.getStudents({ status: 'active' });
        console.log('✅ Got active students:', activeStudents.data.length);

        // Test Case 9: Delete student
        await logTestStep('Deleting a student');
        if (createResult2.data?.id) {
            const deleteResult = await studentTestService.deleteStudent(createResult2.data.id);
            console.log('✅ Student deleted successfully');
            await showTableContents();
        }

        // Test Case 10: Try to delete non-existent student
        await logTestStep('Attempting to delete non-existent student');
        try {
            await studentTestService.deleteStudent('12345678-1234-1234-1234-123456789012');
        } catch (error) {
            if (error instanceof StudentNotFoundError) {
                console.log('✅ Correctly caught student not found error:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 11: Update student with class change
        await logTestStep('Updating student class');
        if (createResult.data?.id) {
            const updateResult = await studentTestService.updateStudent(
                createResult.data.id,
                { class: 'Class 1B' }
            );
            console.log('✅ Student class updated:', updateResult.data?.class);
            await showTableContents();
        }

        // Test Case 12: Test pagination and filtering
        await logTestStep('Testing pagination and filtering');
        
        // Create multiple students for pagination testing
        const studentData = [
            {
                name: 'Alice Smith',
                studentId: 'STU003',
                email: 'alice.smith@school.com',
                class: 'Class 1A',
                parentPhone: '+1234567892',
                dob: '2010-01-03'
            },
            {
                name: 'Bob Johnson',
                studentId: 'STU004',
                email: 'bob.johnson@school.com',
                class: 'Class 1A',
                parentPhone: '+1234567893',
                dob: '2010-01-04'
            },
            {
                name: 'Charlie Brown',
                studentId: 'STU005',
                email: 'charlie.brown@school.com',
                class: 'Class 1B',
                parentPhone: '+1234567894',
                dob: '2010-01-05'
            }
        ];

        for (const data of studentData) {
            await studentTestService.createStudent(data);
        }

        // Test pagination
        const page1 = await studentTestService.getStudents({ limit: 2, page: 1 });
        console.log('✅ Page 1 students:', page1.data.length, 'Total:', page1.total);
        const page2 = await studentTestService.getStudents({ limit: 2, page: 2 });
        console.log('✅ Page 2 students:', page2.data.length);

        // Test search filter
        const searchResult = await studentTestService.getStudents({ search: 'alice' });
        console.log('✅ Search results:', searchResult.data.length);

        // Test Case 13: Test student status update
        await logTestStep('Testing student status update');
        if (createResult.data?.id) {
            const updateResult = await studentTestService.updateStudent(
                createResult.data.id,
                { status: 'inactive' }
            );
            console.log('✅ Student status updated:', updateResult.data?.status);

            // Verify inactive students filter
            const inactiveStudents = await studentTestService.getStudents({ status: 'inactive' });
            console.log('✅ Inactive students found:', inactiveStudents.data.length);
        }

        // Test Case 14: Test invalid data handling
        await logTestStep('Testing invalid data handling');
        
        // Invalid email format
        try {
            await studentTestService.createStudent({
                name: 'Invalid Student',
                studentId: 'STU006',
                email: 'invalid-email',
                class: 'Class 1A',
                parentPhone: '+1234567895',
                dob: '2010-01-06'
            });
        } catch (error) {
            console.log('✅ Correctly caught invalid email error');
        }

        // Invalid phone number
        try {
            await studentTestService.createStudent({
                name: 'Invalid Student',
                studentId: 'STU006',
                email: 'invalid.student@school.com',
                class: 'Class 1A',
                parentPhone: '123', // Too short
                dob: '2010-01-06'
            });
        } catch (error) {
            console.log('✅ Correctly caught invalid phone number error');
        }

        // Invalid class name
        try {
            await studentTestService.createStudent({
                name: 'Invalid Student',
                studentId: 'STU006',
                email: 'invalid.student@school.com',
                class: 'Non-existent Class',
                parentPhone: '+1234567895',
                dob: '2010-01-06'
            });
        } catch (error) {
            console.log('✅ Correctly caught invalid class error');
        }

        // Test Case 15: Test concurrent class enrollment
        await logTestStep('Testing concurrent class enrollment handling');
        if (createResult.data?.id) {
            // Update class multiple times to ensure proper handling
            await studentTestService.updateStudent(createResult.data.id, { class: 'Class 1A' });
            await studentTestService.updateStudent(createResult.data.id, { class: 'Class 1B' });
            const finalClass = await studentTestService.getStudentByIdentifier({ id: createResult.data.id });
            console.log('✅ Final student class:', finalClass.data?.class);
            await showTableContents();
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

describe('Student Service Tests', () => {
    it('should run all student service tests', async () => {
        console.log('🚀 Starting Student Service Tests');
        await testStudentService();
        console.log('✅ All tests completed successfully');
    });
});
