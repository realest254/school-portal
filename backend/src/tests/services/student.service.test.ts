import { studentTestService, StudentFilters } from './student.service';
import { 
    StudentNotFoundError,
    DuplicateStudentError,
    Student
} from '../../services/student.service';
import { ServiceError } from '../../types/common.types';
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
    return table([header, ...rows]);
}

async function showTableContents() {
    console.log('\nCurrent Database Contents:');
    const result = await studentTestService.getStudents();
    console.log(formatAsTable(result.data));
    console.log('──────────────────────────────────────────────────\n');
}

async function logTestStep(description: string) {
    console.log('\n🔍 TEST STEP:', description);
    console.log('──────────────────────────────────────────────────');
}

async function testStudentService() {
    try {
        await logTestStep('Initializing database');
        await studentTestService.initialize();
        await showTableContents();

        // Test Case 1: Input Validation Tests
        await logTestStep('Testing input validation');
        
        const invalidInputs = [
            {
                name: 'Empty student name',
                data: {
                    name: '',
                    studentId: 'STU001',
                    email: 'test@school.com',
                    class: 'Class 1A',
                    parentPhone: '+1234567890',
                    dob: '2010-01-01',
                    status: 'active'
                }
            },
            {
                name: 'Invalid email format',
                data: {
                    name: 'Test Student',
                    studentId: 'STU002',
                    email: 'invalid.email',
                    class: 'Class 1A',
                    parentPhone: '+1234567890',
                    dob: '2010-01-01',
                    status: 'active'
                }
            },
            {
                name: 'Invalid phone number',
                data: {
                    name: 'Test Student',
                    studentId: 'STU003',
                    email: 'test@school.com',
                    class: 'Class 1A',
                    parentPhone: '123', // Too short
                    dob: '2010-01-01',
                    status: 'active'
                }
            },
            {
                name: 'Invalid date format',
                data: {
                    name: 'Test Student',
                    studentId: 'STU004',
                    email: 'test@school.com',
                    class: 'Class 1A',
                    parentPhone: '+1234567890',
                    dob: 'invalid-date',
                    status: 'active'
                }
            }
        ];

        for (const test of invalidInputs) {
            try {
                await studentTestService.createStudent(test.data);
                throw new Error(`Expected validation error for ${test.name} but no error was thrown`);
            } catch (error: any) {
                if (error instanceof Error) {
                    console.log(`✅ Correctly caught ${test.name} error:`, error.message);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 2: Create Valid Student
        await logTestStep('Testing valid student creation');
        
        const validStudent = {
            name: 'John Doe',
            studentId: 'STU005',
            email: 'john.doe@school.com',
            class: 'Class 1A',
            parentPhone: '+1234567890',
            dob: '2010-01-01',
            status: 'active'
        };

        const createResult = await studentTestService.createStudent(validStudent);
        console.log('✅ Created student:', createResult.data);
        await showTableContents();

        // Test Case 3: Duplicate Student Tests
        await logTestStep('Testing duplicate student handling');
        
        const duplicateTests = [
            {
                name: 'Duplicate email',
                data: {
                    ...validStudent,
                    studentId: 'STU006',
                    name: 'Different Name'
                },
                expectedError: DuplicateStudentError,
                expectedMessage: 'Student with this email already exists'
            },
            {
                name: 'Duplicate student ID',
                data: {
                    ...validStudent,
                    email: 'different@school.com',
                    name: 'Different Name'
                },
                expectedError: DuplicateStudentError,
                expectedMessage: 'Student with this student ID already exists'
            }
        ];

        for (const test of duplicateTests) {
            try {
                await studentTestService.createStudent(test.data);
                throw new Error(`Expected ${test.expectedError.name} but no error was thrown for ${test.name}`);
            } catch (error: any) {
                if (error instanceof test.expectedError && error.message.includes(test.expectedMessage)) {
                    console.log(`✅ ${test.name} test passed with expected error:`, error.message);
                } else {
                    console.error(`❌ Wrong error for ${test.name}. Expected ${test.expectedMessage}, got:`, error);
                    throw error;
                }
            }
        }

        // Test Case 4: Update Student Tests
        await logTestStep('Testing student updates');

        if (!createResult.data?.id) {
            throw new Error('No student ID available for update test');
        }

        // First test: Update with non-existent class (should fail)
        const invalidUpdateData = {
            name: 'John Doe Updated',
            class: 'Class 1B'  // Non-existent class
        };

        try {
            await studentTestService.updateStudent(createResult.data.id, invalidUpdateData);
            throw new Error('Expected update with invalid class to fail');
        } catch (error: any) {
            if (error instanceof ServiceError && error.code === 'CLASS_NOT_FOUND') {
                console.log('✅ Update with invalid class correctly failed:', error.message);
            } else {
                throw error;
            }
        }

        // Second test: Update with valid data
        const validUpdateData = {
            name: 'John Doe Updated',
            class: 'Class 1A'  // Existing class
        };

        const updateResult = await studentTestService.updateStudent(createResult.data.id, validUpdateData);
        console.log('✅ Updated student with valid data:', updateResult.data);
        await showTableContents();

        // Test Case 5: Get Student Tests
        await logTestStep('Testing student retrieval');
        
        const getByIdResult = await studentTestService.getStudentByIdentifier({ id: createResult.data.id });
        console.log('✅ Retrieved student by ID:', getByIdResult.data);

        const searchResult = await studentTestService.getStudents({ search: 'John' });
        console.log('✅ Search results:', searchResult.data);

        // Test Case 6: Pagination Tests
        await logTestStep('Testing pagination');

        // Get current count before adding pagination students
        const initialCount = (await studentTestService.getStudents()).total;
        console.log(`✅ Initial student count: ${initialCount}`);

        // Create additional students for pagination, testing both valid and invalid classes
        const paginationStudents = Array.from({ length: 10 }, (_, i) => ({
            name: `Pagination Student ${i + 1}`,
            studentId: `PAG${String(i + 1).padStart(3, '0')}`,
            email: `pag${i + 1}@school.com`,
            class: i % 2 === 0 ? 'Class 1A' : 'Class 1B',  // Intentionally using non-existent class for odd numbers
            parentPhone: `+1234560${String(i + 1).padStart(3, '0')}`,
            dob: '2010-01-01',
            status: 'active'
        }));

        let successfullyCreated = 0;
        for (const student of paginationStudents) {
            try {
                await studentTestService.createStudent(student);
                successfullyCreated++;
            } catch (error) {
                if (error instanceof ServiceError && error.code === 'CLASS_NOT_FOUND') {
                    console.log(`✅ Correctly caught invalid class error for student ${student.name}:`, error.message);
                } else {
                    throw error;
                }
            }
        }

        // We expect only students with Class 1A to be created successfully
        const expectedTotal = initialCount + successfullyCreated;
        const totalCount = await studentTestService.getStudents();
        console.log(`✅ Created ${successfullyCreated} new students successfully, ${paginationStudents.length - successfullyCreated} failed as expected`);
        console.log(`✅ Total students: ${totalCount.total} (Initial: ${initialCount} + New: ${successfullyCreated})`);
        expect(totalCount.total).toBe(expectedTotal);

        // Test different page sizes
        const pageSizes = [5, 10];
        for (const pageSize of pageSizes) {
            const result = await studentTestService.getStudents({ limit: pageSize, page: 1 });
            console.log(`✅ Page size ${pageSize} results:`, result.data.length);
            expect(result.data.length).toBeLessThanOrEqual(pageSize);
        }

        // Test Case 7: Filter Tests
        await logTestStep('Testing filters');

        type ClassFilter = { class: string; status?: never; search?: never; };
        type StatusFilter = { status: 'active' | 'inactive'; class?: never; search?: never; };
        type SearchFilter = { search: string; class?: never; status?: never; };
        type FilterTest = ClassFilter | StatusFilter | SearchFilter;

        // Type guard functions
        function isClassFilter(filter: FilterTest): filter is ClassFilter {
            return 'class' in filter;
        }

        function isStatusFilter(filter: FilterTest): filter is StatusFilter {
            return 'status' in filter;
        }

        function isSearchFilter(filter: FilterTest): filter is SearchFilter {
            return 'search' in filter;
        }

        const filterTests: FilterTest[] = [
            { class: 'Class 1A' },
            { status: 'active' },
            { search: 'John' }
        ];

        console.log('✅ Running filter tests...');
        for (const test of filterTests) {
            const result = await studentTestService.getStudents(test);
            console.log(`✅ Filter results: found ${result.data.length} students matching ${JSON.stringify(test)}`);
            expect(result.data.length).toBeGreaterThanOrEqual(1);
            
            // Verify the filtered results match the filter criteria
            for (const student of result.data) {
                if (isClassFilter(test)) {
                    expect(student.class).toBe(test.class);
                } else if (isStatusFilter(test)) {
                    expect(student.status).toBe(test.status);
                } else if (isSearchFilter(test)) {
                    expect(student.name.toLowerCase()).toContain(test.search.toLowerCase());
                }
            }
        }

        // Test Case 8: Delete Student
        await logTestStep('Testing student deletion');

        if (!createResult.data?.id) {
            throw new Error('No student ID available for deletion test');
        }

        await studentTestService.deleteStudent(createResult.data.id);
        console.log('✅ Deleted student');

        try {
            await studentTestService.getStudentByIdentifier({ id: createResult.data.id });
            throw new Error('Expected StudentNotFoundError but no error was thrown');
        } catch (error) {
            if (error instanceof StudentNotFoundError) {
                console.log('✅ Correctly received not found error after deletion');
            } else {
                throw error;
            }
        }

        console.log('✅ All tests completed successfully');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

describe('Student Service Tests', () => {
    it('should run all student service tests', async () => {
        console.log('🚀 Starting Student Service Tests');
        await testStudentService();
    });
});
