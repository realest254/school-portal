import { 
    teacherTestService,
    TeacherNotFoundError,
    DuplicateTeacherError,
    SubjectNotFoundError,
    Teacher
} from './teacher.service';
import { ServiceError, ServiceResult } from '../../types/common.types';
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

        // Test Case 1: Input Validation Tests
        await logTestStep('Testing input validation');
        
        const invalidInputs = [
            {
                name: 'Missing @ Symbol Email',
                data: {
                    name: 'Test Teacher',
                    employeeId: 'EMP001',
                    email: 'invalid.email', // Invalid email - missing @ symbol
                    phone: '+1234567890',
                    subjects: ['Mathematics'],
                    joinDate: '2023-01-01'
                }
            },
            {
                name: 'Missing Domain Email',
                data: {
                    name: 'Test Teacher',
                    employeeId: 'EMP002',
                    email: 'test@', // Invalid email - missing domain
                    phone: '+1234567890',
                    subjects: ['Mathematics'],
                    joinDate: '2023-01-01'
                }
            },
            {
                name: 'Invalid Domain Email',
                data: {
                    name: 'Test Teacher',
                    employeeId: 'EMP003',
                    email: 'test@invalid', // Invalid email - invalid domain
                    phone: '+1234567890',
                    subjects: ['Mathematics'],
                    joinDate: '2023-01-01'
                }
            },
            {
                name: 'Empty Email',
                data: {
                    name: 'Test Teacher',
                    employeeId: 'EMP004',
                    email: '', // Invalid email - empty
                    phone: '+1234567890',
                    subjects: ['Mathematics'],
                    joinDate: '2023-01-01'
                }
            },
            {
                name: 'Invalid Phone',
                data: {
                    name: 'Test Teacher',
                    employeeId: 'EMP001',
                    email: 'test@school.com',
                    phone: '123', // Invalid phone
                    subjects: ['Mathematics'],
                    joinDate: '2023-01-01'
                }
            },
            {
                name: 'Invalid Employee ID',
                data: {
                    name: 'Test Teacher',
                    employeeId: 'E1', // Too short
                    email: 'test@school.com',
                    phone: '+1234567890',
                    subjects: ['Mathematics'],
                    joinDate: '2023-01-01'
                }
            },
            {
                name: 'Empty Name',
                data: {
                    name: '', // Empty name
                    employeeId: 'EMP001',
                    email: 'test@school.com',
                    phone: '+1234567890',
                    subjects: ['Mathematics'],
                    joinDate: '2023-01-01'
                }
            },
            {
                name: 'Invalid Date',
                data: {
                    name: 'Test Teacher',
                    employeeId: 'EMP001',
                    email: 'test@school.com',
                    phone: '+1234567890',
                    subjects: ['Mathematics'],
                    joinDate: 'invalid-date' // Invalid date
                }
            }
        ];

        for (const test of invalidInputs) {
            try {
                await teacherTestService.createTeacher(test.data);
                console.error(`❌ Should have failed: ${test.name}`);
                throw new Error(`Validation should have failed for ${test.name}`);
            } catch (error) {
                if (error instanceof ServiceError || (error instanceof Error && error.message.includes('Invalid datetime'))) {
                    console.log(`✅ Correctly caught validation error for ${test.name}:`, error.message);
                } else {
                    throw error;
                }
            }
        }

        // Create a valid teacher for subsequent tests
        const createResult = await teacherTestService.createTeacher({
            name: 'John Doe',
            employeeId: 'EMP001',
            email: 'john.doe@school.com',
            phone: '+1234567890',
            subjects: ['Mathematics'],
            joinDate: '2023-01-01',
            class: 'Form 1A'
        });
        console.log('✅ Base teacher created successfully:', createResult.data);

        // Test Case 2: Class Assignment Tests
        await logTestStep('Testing class assignments');

        // Try to assign to non-existent class
        try {
            await teacherTestService.updateTeacher(createResult.data?.id!, {
                class: 'Non-Existent Class'
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                console.log('✅ Correctly caught non-existent class error:', error.message);
            } else {
                throw error;
            }
        }

        // Change class assignment
        const classUpdateResult = await teacherTestService.updateTeacher(createResult.data?.id!, {
            class: 'Form 1B'
        });
        console.log('✅ Successfully changed class assignment:', classUpdateResult.data?.class);

        // Remove class assignment
        const removeClassResult = await teacherTestService.updateTeacher(createResult.data?.id!, {
            class: undefined
        });
        console.log('✅ Successfully removed class assignment:', !removeClassResult.data?.class);

        // Test Case 3: Subject Assignment Tests
        await logTestStep('Testing subject assignments');

        // Empty subjects array
        const emptySubjectsResult = await teacherTestService.updateTeacher(createResult.data?.id!, {
            subjects: []
        });
        console.log('✅ Successfully updated with empty subjects:', emptySubjectsResult.data?.subjects);

        // Duplicate subjects
        try {
            await teacherTestService.updateTeacher(createResult.data?.id!, {
                subjects: ['Mathematics', 'Mathematics']
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                console.log('✅ Correctly handled duplicate subjects:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 4: Status Tests
        await logTestStep('Testing status changes');

        // Change to inactive
        const inactiveResult = await teacherTestService.updateTeacher(createResult.data?.id!, {
            status: 'inactive'
        });
        console.log('✅ Successfully changed status to inactive:', inactiveResult.data?.status);

        // Try operations on inactive teacher
        try {
            await teacherTestService.updateTeacher(createResult.data?.id!, {
                subjects: ['Physics']
            });
            console.log('✅ Can update inactive teacher');
        } catch (error) {
            console.log('❌ Should allow updates to inactive teacher');
            throw error;
        }

        // Try invalid status value
        try {
            await teacherTestService.updateTeacher(createResult.data?.id!, {
                // @ts-expect-error - Intentionally testing invalid status
                status: 'invalid_status'
            });
        } catch (error) {
            if (error instanceof ServiceError) {
                console.log('✅ Correctly caught invalid status error:', error.message);
            } else {
                throw error;
            }
        }

        // Try to reactivate teacher
        const reactivateResult = await teacherTestService.updateTeacher(createResult.data?.id!, {
            status: 'active'
        });
        console.log('✅ Successfully reactivated teacher:', reactivateResult.data?.status);

        // Test Case 5: Advanced Filter Tests
        await logTestStep('Testing advanced filters');

        // Create more test data
        const testTeachers = [
            {
                name: 'Alice Smith-Jones',
                employeeId: 'EMP002',
                email: 'alice.smith@school.com',
                phone: '+1234567891',
                subjects: ['English', 'Biology'],
                joinDate: '2023-01-02',
                class: 'Form 1B'
            },
            {
                name: 'Bob Johnson',
                employeeId: 'EMP003',
                email: 'bob.johnson@school.com',
                phone: '+1234567892',
                subjects: ['Physics', 'Mathematics'],
                joinDate: '2023-01-03',
                class: 'Form 1A',
                status: 'inactive'
            }
        ];

        for (const teacher of testTeachers) {
            await teacherTestService.createTeacher(teacher);
        }

        // Test multiple filters
        const advancedFilterTests = [
            { 
                name: 'Multiple criteria',
                filter: { 
                    status: 'active' as const,
                    class: 'Form 1B',
                    search: 'Smith'
                }
            },
            {
                name: 'Special characters in search',
                filter: {
                    search: 'Smith-Jones'
                }
            },
            {
                name: 'Case insensitive search',
                filter: {
                    search: 'SMITH'
                }
            },
            {
                name: 'Filter by status and search',
                filter: {
                    status: 'inactive' as const,
                    search: 'Bob'
                }
            }
        ];

        for (const test of advancedFilterTests) {
            console.log(`\n📋 Testing ${test.name}:`, test.filter);
            const result = await teacherTestService.getTeachers(test.filter);
            console.log('Results:', formatAsTable(result.data));
        }

        // Test Case 6: Get teacher by different identifiers
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

        // Test Case 7: Get non-existent teacher
        await logTestStep('Attempting to get non-existent teacher');
        try {
            await teacherTestService.getTeacherByIdentifier({ 
                id: '12345678-1234-1234-1234-123456789012' 
            });
        } catch (error) {
            if (error instanceof TeacherNotFoundError) {
                console.log('✅ Correctly caught teacher not found error:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 8: Create teacher with duplicate email
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

        // Test Case 9: Create teacher with duplicate employee ID
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

        // Test Case 10: Update teacher
        await logTestStep('Updating teacher information');
        if (createResult.data?.id) {
            const updateResult = await teacherTestService.updateTeacher(
                createResult.data.id,
                {
                    name: 'John Smith',
                    email: 'john.smith@school.com',
                    subjects: ['Mathematics', 'Physics']
                }
            );
            console.log('✅ Teacher updated successfully:', updateResult.data);
            await showTableContents();
        }

        // Test Case 11: Update non-existent teacher
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

        // Test Case 12: Update teacher with non-existent subject
        await logTestStep('Attempting to update teacher with non-existent subject');
        if (createResult.data?.id) {
            try {
                await teacherTestService.updateTeacher(
                    createResult.data.id,
                    { subjects: ['NonExistentSubject'] }
                );
            } catch (error) {
                if (error instanceof SubjectNotFoundError) {
                    console.log('✅ Correctly caught subject not found error:', error.message);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 13: Get teachers with filters
        await logTestStep('Testing teacher filters');
        
        // Test creating a teacher with non-existent subject
        await logTestStep('Testing teacher creation with non-existent subject');
        try {
            await teacherTestService.createTeacher({
                name: 'Teacher With Invalid Subject',
                employeeId: 'EMP099',
                email: 'invalid.subject@school.com',
                phone: '+1234567899',
                subjects: ['NonExistentSubject', 'AnotherFakeSubject'],
                joinDate: '2023-01-04'
            });
            console.log('❌ Should have failed: Teacher creation with non-existent subject');
            throw new Error('Expected subject not found error');
        } catch (error) {
            if (error instanceof SubjectNotFoundError) {
                console.log('✅ Correctly caught subject not found error:', error.message);
            } else {
                throw error;
            }
        }
        
        // Create additional test teachers with duplicate data to test error handling
        const testTeachers2 = [
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
                subjects: ['Physics'],
                joinDate: '2023-01-03',
                class: 'Form 1A'
            }
        ];

        // Test duplicate creation - should handle errors gracefully
        for (const teacher of testTeachers2) {
            try {
                await teacherTestService.createTeacher(teacher);
                console.log(`❌ Should have failed: Duplicate teacher creation for ${teacher.name}`);
                throw new Error(`Expected duplicate error for ${teacher.name}`);
            } catch (error) {
                if (error instanceof DuplicateTeacherError) {
                    console.log(`✅ Correctly caught duplicate teacher error for ${teacher.name}:`, error.message);
                } else {
                    throw error;
                }
            }
        }

        // Now create teachers with unique data for filter testing
        const uniqueTeachers = [
            {
                name: 'Alice Smith',
                employeeId: 'EMP004',
                email: 'alice.smith2@school.com',
                phone: '+1234567891',
                subjects: ['English'],
                joinDate: '2023-01-02',
                class: 'Form 1B'
            },
            {
                name: 'Bob Johnson',
                employeeId: 'EMP005',
                email: 'bob.johnson2@school.com',
                phone: '+1234567892',
                subjects: ['Physics'],
                joinDate: '2023-01-03',
                class: 'Form 1A'
            }
        ];

        for (const teacher of uniqueTeachers) {
            await teacherTestService.createTeacher(teacher);
        }

        // Test different filters
        const filterTests = [
            { status: 'active' as const },
            { class: 'Form 1A' },
            { search: 'john' }
        ];

        for (const filter of filterTests) {
            console.log('\n📋 Testing filter:', filter);
            const result = await teacherTestService.getTeachers(filter);
            console.log('Results:', formatAsTable(result.data));
        }

        // Test Case 14: Test pagination
        await logTestStep('Testing pagination');
        
        const paginationTest = await teacherTestService.getTeachers({ 
            limit: 2,
            page: 1
        });
        console.log('Pagination test (limit=2, page=1):', {
            total: paginationTest.total,
            page: paginationTest.page,
            limit: paginationTest.limit,
            results: paginationTest.data.length
        });

        // Test Case 15: Delete teacher
        await logTestStep('Deleting teacher');
        if (createResult.data?.id) {
            await teacherTestService.deleteTeacher(createResult.data.id);
            console.log('✅ Teacher deleted successfully');

            // Verify deletion
            try {
                await teacherTestService.getTeacherByIdentifier({ 
                    id: createResult.data.id 
                });
            } catch (error) {
                if (error instanceof TeacherNotFoundError) {
                    console.log('✅ Verified teacher was deleted:', error.message);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 16: Delete non-existent teacher
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

        await showTableContents();

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

describe('Teacher Service Tests', () => {
    it('should run all teacher service tests', async () => {
        console.log('🚀 Starting Teacher Service Tests');
        await testTeacherService();
        console.log('✅ All tests completed successfully');
    });
});