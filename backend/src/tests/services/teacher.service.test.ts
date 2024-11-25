import { teacherTestService } from './teacher.service';
import { DuplicateTeacherError, TeacherNotFoundError } from '../../services/teacher.service';
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
    const db = await teacherTestService.getDatabase();
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

async function testTeacherService() {
    try {
        await logTestStep('Initializing database');
        await teacherTestService.initialize();
        await showTableContents();

        // Test Case 1: Create a valid teacher
        await logTestStep('Creating a valid teacher');
        const createResult = await teacherTestService.createTeacher({
            name: 'John Doe',
            employeeId: 'EMP001',
            email: 'john.doe@school.com',
            phone: '+1234567890',
            subjects: ['Mathematics'],
            joinDate: '2023-01-01',
            class: 'Form 1A'
        });
        console.log('✅ Teacher created successfully:', createResult.data);
        await showTableContents();

        // Test Case 2: Get teacher by different identifiers
        await logTestStep('Getting teacher by different identifiers');
        
        // By ID
        const byId = await teacherTestService.getTeacherByIdentifier({ 
            id: createResult.data?.id 
        });
        console.log('✅ Got teacher by ID:', byId.data?.name);

        // By Email
        const byEmail = await teacherTestService.getTeacherByIdentifier({ 
            email: 'john.doe@school.com' 
        });
        console.log('✅ Got teacher by email:', byEmail.data?.name);

        // By Employee ID
        const byEmployeeId = await teacherTestService.getTeacherByIdentifier({ 
            employeeId: 'EMP001' 
        });
        console.log('✅ Got teacher by employee ID:', byEmployeeId.data?.name);

        // By Name
        const byName = await teacherTestService.getTeacherByIdentifier({ 
            name: 'John Doe' 
        });
        console.log('✅ Got teacher by name:', byName.data?.name);

        // Test Case 3: Get non-existent teacher with different identifiers
        await logTestStep('Attempting to get non-existent teacher with different identifiers');
        
        const nonExistentCases = [
            { id: '12345678-1234-1234-1234-123456789012' },
            { email: 'nonexistent@school.com' },
            { employeeId: 'NOEMP' },
            { name: 'Non Existent' }
        ];

        for (const identifier of nonExistentCases) {
            try {
                await teacherTestService.getTeacherByIdentifier(identifier);
            } catch (error) {
                if (error instanceof TeacherNotFoundError) {
                    console.log('✅ Correctly caught teacher not found error:', error.message);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 4: Try to create teachers with duplicate fields
        await logTestStep('Attempting to create teacher with duplicate email');
        try {
            await teacherTestService.createTeacher({
                name: 'Jane Doe',
                employeeId: 'EMP002',
                email: 'john.doe@school.com', // Same email as John
                phone: '+1234567891',
                subjects: ['Physics'],
                joinDate: '2023-01-02'
            });
        } catch (error) {
            if (error instanceof DuplicateTeacherError) {
                console.log('✅ Correctly caught duplicate email error:', error.message);
            } else {
                throw error;
            }
        }

        await logTestStep('Attempting to create teacher with duplicate employee ID');
        try {
            await teacherTestService.createTeacher({
                name: 'Jane Doe',
                employeeId: 'EMP001', // Same as John
                email: 'jane.doe@school.com',
                phone: '+1234567891',
                subjects: ['Physics'],
                joinDate: '2023-01-02'
            });
        } catch (error) {
            if (error instanceof DuplicateTeacherError) {
                console.log('✅ Correctly caught duplicate employee ID error:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 5: Update teacher with same information
        await logTestStep('Updating teacher with same information');
        if (createResult.data?.id) {
            const updateResult = await teacherTestService.updateTeacher(
                createResult.data.id,
                {
                    name: 'John Doe',
                    email: 'john.doe@school.com'
                }
            );
            console.log('✅ Update with same info completed:', updateResult.data);
            await showTableContents();
        }

        // Test Case 6: Update non-existent teacher
        await logTestStep('Attempting to update non-existent teacher');
        try {
            await teacherTestService.updateTeacher(
                '12345678-1234-1234-1234-123456789012',
                { name: 'Ghost Teacher' }
            );
        } catch (error) {
            if (error instanceof TeacherNotFoundError) {
                console.log('✅ Correctly caught teacher not found error:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 7: Get teachers with various filters
        await logTestStep('Testing different filter combinations');
        const filterTests = [
            { status: 'active' as const },
            { class: 'Form 1A' },
            { search: 'john' },
            { status: 'active' as const, class: 'Form 1A' }
        ];

        for (const filter of filterTests) {
            console.log('\n📋 Testing filter:', filter);
            const result = await teacherTestService.getTeachers(filter);
            console.log('Results:', formatAsTable(result.data));
        }

        // Test Case 8: Testing pagination
        await logTestStep('Testing pagination functionality');
        
        // Create additional test teachers for pagination
        const testTeachers = [
            {
                name: 'Alice Smith',
                employeeId: 'EMP002',
                email: 'alice.smith@school.com',
                phone: '+1234567891',
                subjects: ['English'],
                joinDate: '2023-01-02',
                class: 'Form 1B'
            },
            {
                name: 'Bob Johnson',
                employeeId: 'EMP003',
                email: 'bob.johnson@school.com',
                phone: '+1234567892',
                subjects: ['History'],
                joinDate: '2023-01-03',
                class: 'Form 1A'
            },
            {
                name: 'Carol White',
                employeeId: 'EMP004',
                email: 'carol.white@school.com',
                phone: '+1234567893',
                subjects: ['Biology'],
                joinDate: '2023-01-04',
                class: 'Form 1B'
            }
        ];

        for (const teacher of testTeachers) {
            await teacherTestService.createTeacher(teacher);
        }

        // Test default pagination (page 1, limit 10)
        const defaultPagination = await teacherTestService.getTeachers({});
        console.log('✅ Default pagination:', {
            total: defaultPagination.total,
            page: defaultPagination.page,
            limit: defaultPagination.limit,
            actualResults: defaultPagination.data.length
        });

        // Test custom page size
        const customPageSize = await teacherTestService.getTeachers({ limit: 2 });
        console.log('✅ Custom page size (limit=2):', {
            total: customPageSize.total,
            page: customPageSize.page,
            limit: customPageSize.limit,
            actualResults: customPageSize.data.length
        });

        // Test second page
        const secondPage = await teacherTestService.getTeachers({ page: 2, limit: 2 });
        console.log('✅ Second page (page=2, limit=2):', {
            total: secondPage.total,
            page: secondPage.page,
            limit: secondPage.limit,
            actualResults: secondPage.data.length
        });

        // Verify pagination with filters
        const filteredPagination = await teacherTestService.getTeachers({
            class: 'Form 1B',
            limit: 1,
            page: 1
        });
        console.log('✅ Filtered pagination (class="Form 1B", limit=1, page=1):', {
            total: filteredPagination.total,
            page: filteredPagination.page,
            limit: filteredPagination.limit,
            actualResults: filteredPagination.data.length
        });

        // Test empty page
        const emptyPage = await teacherTestService.getTeachers({ page: 999, limit: 10 });
        console.log('✅ Empty page (page=999):', {
            total: emptyPage.total,
            page: emptyPage.page,
            limit: emptyPage.limit,
            actualResults: emptyPage.data.length
        });

        await showTableContents();

        // Test Case 9: Delete teacher and verify cascade
        await logTestStep('Testing delete cascade');
        if (createResult.data?.id) {
            await teacherTestService.deleteTeacher(createResult.data.id);
            console.log('✅ Teacher deleted, checking remaining data:');
            await showTableContents();

            // Verify teacher no longer exists using getTeacherByIdentifier
            try {
                await teacherTestService.getTeacherByIdentifier({ id: createResult.data.id });
            } catch (error) {
                if (error instanceof TeacherNotFoundError) {
                    console.log('✅ Verified teacher was deleted:', error.message);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 10: Delete non-existent teacher
        await logTestStep('Attempting to delete non-existent teacher');
        try {
            await teacherTestService.deleteTeacher('12345678-1234-1234-1234-123456789012');
        } catch (error) {
            if (error instanceof TeacherNotFoundError) {
                console.log('✅ Correctly caught teacher not found error:', error.message);
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the tests
console.log('🚀 Starting Teacher Service Tests');
testTeacherService()
    .then(() => console.log('✨ All tests completed successfully'))
    .catch(error => {
        console.error('💥 Tests failed:', error);
        process.exit(1);
    });
