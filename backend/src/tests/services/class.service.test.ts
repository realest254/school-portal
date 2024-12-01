import { classService } from './class.service';
import { table } from 'table';
import { ServiceError, ServiceResult } from '../../types/common.types';

// Helper function to format data as a table for better visualization
function formatAsTable(data: any[]): string {
    if (!data || data.length === 0) return 'No data';

    const keys = Array.from(new Set(
        data.flatMap(obj => Object.keys(obj))
    ));

    const header = keys;
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

// Helper function to show current database contents
async function showTableContents() {
    const result = await classService.getAll();
    console.log('\nCurrent Classes:');
    console.log(formatAsTable(result.data || []));
}

// Helper function to log test steps
async function logTestStep(description: string) {
    console.log(`\n📝 ${description}`);
}

// Helper to ensure data is not null
function assertData<T>(result: ServiceResult<T>, message: string): T {
    if (!result.data) {
        throw new Error(`${message}: Data is null`);
    }
    return result.data;
}

async function testClassService() {
    try {
        await logTestStep('Setting up test environment');
        await showTableContents();

        // Test Case 1: Input Validation Tests
        await logTestStep('Testing input validation');
        
        const invalidInputs = [
            {
                name: 'Invalid Grade (Too Low)',
                data: {
                    name: 'Class A',
                    grade: 0,
                    academicYear: 2023
                }
            },
            {
                name: 'Invalid Grade (Too High)',
                data: {
                    name: 'Class B',
                    grade: 13,
                    academicYear: 2023
                }
            },
            {
                name: 'Invalid Academic Year (Too Low)',
                data: {
                    name: 'Class C',
                    grade: 1,
                    academicYear: 1999
                }
            },
            {
                name: 'Empty Class Name',
                data: {
                    name: '',
                    grade: 1,
                    academicYear: 2023
                }
            },
            {
                name: 'Null Values',
                data: {
                    name: null,
                    grade: null,
                    academicYear: null
                } as any
            },
            {
                name: 'Undefined Values',
                data: {
                    name: undefined,
                    grade: undefined,
                    academicYear: undefined
                } as any
            }
        ];

        for (const input of invalidInputs) {
            try {
                await classService.create(input.data);
                throw new Error(`Expected validation error for ${input.name} but got success`);
            } catch (error) {
                if (!(error instanceof ServiceError)) {
                    throw error;
                }
                console.log(`✅ ${input.name}: Got expected validation error`);
            }
        }

        // Test Case 2: Successfully Create a Class
        await logTestStep('Testing class creation');
        
        const createResult = await classService.create({
            name: 'Class 1A',
            grade: 1,
            stream: 'A',
            academicYear: 2023
        });
        const newClass = assertData(createResult, 'Failed to create class');

        console.log('Created class:', newClass);
        await showTableContents();

        // Test Case 3: Duplicate Class Prevention
        await logTestStep('Testing duplicate class prevention');
        
        try {
            await classService.create({
                name: 'Class 1A',
                grade: 1,
                stream: 'A',
                academicYear: 2023
            });
            throw new Error('Expected duplicate class error but got success');
        } catch (error) {
            if (!(error instanceof ServiceError) || error.code !== 'DUPLICATE_CLASS') {
                throw error;
            }
            console.log('✅ Got expected duplicate class error');
        }

        // Test Case 4: Update Class with Edge Cases
        await logTestStep('Testing class updates with edge cases');
        
        // Test 4.1: Normal update
        const updateResult = await classService.update(newClass.id, {
            name: 'Class 1B',
            stream: 'B',
            isActive: false
        });
        const updatedClass = assertData(updateResult, 'Failed to update class');
        console.log('Updated class:', updatedClass);

        // Test 4.2: Update with empty optional fields
        try {
            await classService.update(newClass.id, {
                stream: '',  // Empty optional field
            });
            console.log('✅ Successfully updated with empty optional field');
        } catch (error) {
            throw new Error('Failed to update with empty optional field');
        }

        // Test 4.3: Update non-existent class
        try {
            await classService.update('non-existent-id', {
                name: 'Should Fail'
            });
            throw new Error('Expected class not found error but got success');
        } catch (error) {
            if (!(error instanceof ServiceError) || error.code !== 'CLASS_NOT_FOUND') {
                throw error;
            }
            console.log('✅ Got expected class not found error for update');
        }

        await showTableContents();

        // Test Case 5: Get Class by ID with Edge Cases
        await logTestStep('Testing get class by ID with edge cases');
        
        // Test 5.1: Get existing class
        const getResult = await classService.getById(newClass.id);
        const retrievedClass = assertData(getResult, 'Failed to get class');
        console.log('Retrieved class:', retrievedClass);

        // Test 5.2: Get non-existent class
        try {
            await classService.getById('non-existent-id');
            throw new Error('Expected class not found error but got success');
        } catch (error) {
            if (!(error instanceof ServiceError) || error.code !== 'CLASS_NOT_FOUND') {
                throw error;
            }
            console.log('✅ Got expected class not found error for getById');
        }

        // Test Case 6: Comprehensive Filter Tests
        await logTestStep('Testing comprehensive filters');
        
        // Create multiple classes for filter testing
        const classes = [
            {
                name: 'Class 2A',
                grade: 2,
                stream: 'A',
                academicYear: 2023
            },
            {
                name: 'Class 3B',
                grade: 3,
                stream: 'B',
                academicYear: 2023
            },
            {
                name: 'Class 2C',
                grade: 2,
                stream: 'C',
                academicYear: 2024
            }
        ];

        for (const classData of classes) {
            await classService.create(classData);
        }

        // Test 6.1: Filter by grade
        const gradeFilterResults = await classService.getAll({ grade: 2 });
        console.log('Classes filtered by grade 2:', gradeFilterResults.data);
        if (gradeFilterResults.data?.length !== 2) {
            throw new Error('Expected 2 classes with grade 2');
        }

        // Test 6.2: Filter by academic year
        const yearFilterResults = await classService.getAll({ academicYear: 2024 });
        console.log('Classes in 2024:', yearFilterResults.data);
        if (yearFilterResults.data?.length !== 1) {
            throw new Error('Expected 1 class in 2024');
        }

        // Test 6.3: Multiple filters
        const multiFilterResults = await classService.getAll({
            grade: 2,
            academicYear: 2023,
            isActive: true
        });
        console.log('Classes with multiple filters:', multiFilterResults.data);

        // Test 6.4: Pagination
        const pagedResults = await classService.getAll({
            page: 1,
            limit: 2
        });
        console.log('Paginated classes:', pagedResults.data);
        if (pagedResults.data?.length !== 2) {
            throw new Error('Expected 2 classes in paginated results');
        }

        // Test 6.5: Empty filters
        const noFilterResults = await classService.getAll({});
        console.log('All classes (no filters):', noFilterResults.data);

        // Test Case 7: Delete Class Edge Cases
        await logTestStep('Testing class deletion edge cases');
        
        // Test 7.1: Delete existing class
        const deleteResult = await classService.delete(newClass.id);
        assertData(deleteResult, 'Failed to delete class');

        // Test 7.2: Verify class is deleted
        try {
            await classService.getById(newClass.id);
            throw new Error('Expected class not found error but got success');
        } catch (error) {
            if (!(error instanceof ServiceError) || error.code !== 'CLASS_NOT_FOUND') {
                throw error;
            }
            console.log('✅ Got expected class not found error after deletion');
        }

        // Test 7.3: Delete non-existent class
        try {
            await classService.delete('non-existent-id');
            throw new Error('Expected class not found error but got success');
        } catch (error) {
            if (!(error instanceof ServiceError) || error.code !== 'CLASS_NOT_FOUND') {
                throw error;
            }
            console.log('✅ Got expected class not found error for delete');
        }

        console.log('✅ All tests passed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        throw error;
    }
}

describe('Class Service Tests', () => {
    it('should run all class service tests', async () => {
        console.log('🚀 Starting Class Service Tests');
        await testClassService();
    });
});
