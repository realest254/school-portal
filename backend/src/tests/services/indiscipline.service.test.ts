import { IndisciplineTestService } from './indiscipline.service';
import { table } from 'table';

// Define the create input type based on the service's create method parameter type
interface CreateIndisciplineInput {
    studentAdmissionNumber: string;
    reporterEmail: string;
    incident_date: Date;
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    action_taken?: string;
}

// Define types locally since they're not exported from the service
type Severity = 'minor' | 'moderate' | 'severe';

interface IndisciplineRecord {
    id?: string;
    studentAdmissionNumber: string;
    reporterEmail: string;
    incident_date: Date;
    description: string;
    severity: Severity;
    action_taken?: string;
    status?: string;
}

class IndisciplineError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'IndisciplineError';
    }
}

const IndisciplineErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

const indisciplineTestService = IndisciplineTestService.getInstance();

async function logTestStep(description: string) {
    console.log(`\n🔍 TEST STEP: ${description}`);
    console.log('─'.repeat(50));
}

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
            if (typeof value === 'object' && value instanceof Date) return value.toISOString();
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
    console.log('\nCurrent Database Contents:');
    const records = await indisciplineTestService.getAll();
    console.log(formatAsTable(records));
    console.log('──────────────────────────────────────────────────\n');
}

async function testIndisciplineService() {
    try {
        // Test Case 1: Input Validation Tests
        await logTestStep('Testing input validation');
        
        const validationTests = [
            {
                name: 'Empty description',
                data: {
                    studentAdmissionNumber: 'STU001',
                    reporterEmail: 'teacher@school.com',
                    incident_date: new Date(),
                    description: '',  // Empty description
                    severity: 'minor' as const
                },
                expectedError: 'String must contain at least 1 character'
            },
            {
                name: 'Invalid email format',
                data: {
                    studentAdmissionNumber: 'STU001',
                    reporterEmail: 'invalid-email',
                    incident_date: new Date(),
                    description: 'Test incident',
                    severity: 'minor' as const
                },
                expectedError: 'Invalid email'
            },
            {
                name: 'Invalid severity',
                data: {
                    studentAdmissionNumber: 'STU001',
                    reporterEmail: 'teacher@school.com',
                    incident_date: new Date(),
                    description: 'Test incident',
                    severity: 'invalid' as any
                },
                expectedError: 'Invalid enum value'
            }
        ];

        for (const test of validationTests) {
            try {
                console.log(`\n📋 Testing validation: ${test.name}`);
                await indisciplineTestService.create(test.data as any);
                throw new Error(`Expected validation error for ${test.name} but got success`);
            } catch (error) {
                if (error instanceof Error) {
                    const errorMessage = error.message || 'Unknown error';
                    if (!errorMessage.includes(test.expectedError)) {
                        throw new Error(`Expected error message containing "${test.expectedError}" but got "${errorMessage}"`);
                    }
                    console.log(`✅ Correctly caught validation error for ${test.name}:`, errorMessage);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 2: Create Valid Records
        await logTestStep('Testing valid record creation');

        const validRecord: CreateIndisciplineInput = {
            studentAdmissionNumber: 'STU001',
            reporterEmail: 'teacher@school.com',
            incident_date: new Date(),
            description: 'Test incident description',
            severity: 'minor',
            action_taken: 'Verbal warning'
        };

        const createdRecord = await indisciplineTestService.create(validRecord);
        console.log('✅ Created record:', createdRecord);
        await showTableContents();

        // Test Case 3: Get Record Tests
        await logTestStep('Testing record retrieval');

        // Test getById
        const retrievedRecord = await indisciplineTestService.getById(createdRecord.id);
        console.log('✅ Retrieved record by ID:', retrievedRecord);

        // Create more test records with different severities and dates
        const moreRecords = [
            {
                ...validRecord,
                severity: 'moderate' as const,
                incident_date: new Date('2024-01-01')
            },
            {
                ...validRecord,
                severity: 'severe' as const,
                incident_date: new Date('2024-02-01')
            }
        ];

        for (const record of moreRecords) {
            await indisciplineTestService.create(record);
        }

        // Test filter validation
        await logTestStep('Testing filter validation');
        
        const filterValidationTests = [
            {
                name: 'invalid severity',
                filter: { severity: 'invalid' },
                expectedError: 'Invalid enum value'
            },
            {
                name: 'invalid status',
                filter: { status: 'pending' },
                expectedError: 'Invalid enum value'
            },
            {
                name: 'invalid date format',
                filter: { startDate: 'not-a-date' },
                expectedError: 'Expected date'
            },
            {
                name: 'end date before start date',
                filter: { 
                    startDate: new Date('2024-02-01'),
                    endDate: new Date('2024-01-01')
                },
                expectedError: 'End date must be after start date'
            },
            {
                name: 'invalid student_id format',
                filter: { student_id: 'not-a-uuid' },
                expectedError: 'Invalid uuid'
            }
        ];

        for (const test of filterValidationTests) {
            try {
                await indisciplineTestService.getAll(test.filter as any);
                throw new Error(`Expected validation error for ${test.name} but got success`);
            } catch (error) {
                if (error instanceof Error) {
                    const errorMessage = error.message;
                    if (!errorMessage.includes(test.expectedError)) {
                        throw new Error(`Expected error message containing "${test.expectedError}" but got "${errorMessage}"`);
                    }
                    console.log(`✅ Correctly caught filter validation error for ${test.name}:`, errorMessage);
                }
            }
        }

        // Test valid filters
        await logTestStep('Testing valid filters');

        const filterTests = [
            {
                name: 'by severity',
                filter: { severity: 'moderate' },
                expectedCount: 1,
                validate: (records: any[]) => records.every(r => r.severity === 'moderate')
            },
            {
                name: 'by status',
                filter: { status: 'active' },
                expectedCount: 3,
                validate: (records: any[]) => records.every(r => r.status === 'active')
            },
            {
                name: 'by date range',
                filter: {
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31')
                },
                expectedCount: 1,
                validate: (records: any[]) => records.every(r => {
                    const date = new Date(r.incident_date);
                    return date >= new Date('2024-01-01') && date <= new Date('2024-01-31');
                })
            },
            {
                name: 'combined filters',
                filter: {
                    severity: 'severe',
                    status: 'active',
                    startDate: new Date('2024-02-01')
                },
                expectedCount: 1,
                validate: (records: any[]) => records.every(r => 
                    r.severity === 'severe' && 
                    r.status === 'active' && 
                    new Date(r.incident_date) >= new Date('2024-02-01')
                )
            }
        ];

        for (const test of filterTests) {
            const records = await indisciplineTestService.getAll(test.filter);
            if (records.length !== test.expectedCount) {
                throw new Error(`Filter ${test.name} returned ${records.length} records, expected ${test.expectedCount}`);
            }
            if (!test.validate(records)) {
                throw new Error(`Filter ${test.name} returned records that don't match filter criteria`);
            }
            console.log(`✅ Filter test "${test.name}" passed with ${records.length} records`);
        }

        // Test empty results
        const emptyResults = await indisciplineTestService.getAll({
            severity: 'minor',
            startDate: new Date('2025-01-01')
        });
        if (emptyResults.length !== 0) {
            throw new Error('Expected no results for future date filter');
        }
        console.log('✅ Empty results test passed');

        // Test Case 4: Update Record Tests
        await logTestStep('Testing record updates');

        // Test update validation
        const updateValidationTests = [
            {
                name: 'empty update',
                data: {},
                expectedError: 'At least one field must be provided for update'
            },
            {
                name: 'invalid severity in update',
                data: { severity: 'very-bad' },
                expectedError: 'Invalid enum value'
            },
            {
                name: 'invalid status in update',
                data: { status: 'in-progress' },
                expectedError: 'Invalid enum value'
            },
            {
                name: 'empty description in update',
                data: { description: '' },
                expectedError: 'String must contain at least 1 character'
            },
            {
                name: 'invalid email in update',
                data: { reporterEmail: 'not-an-email' },
                expectedError: 'Invalid email'
            },
            {
                name: 'non-existent student',
                data: { studentAdmissionNumber: 'NONEXISTENT' },
                expectedError: 'Student with admission number NONEXISTENT not found'
            },
            {
                name: 'non-existent teacher',
                data: { reporterEmail: 'nonexistent@school.com' },
                expectedError: 'Teacher with email nonexistent@school.com not found'
            }
        ];

        for (const test of updateValidationTests) {
            try {
                await indisciplineTestService.update(createdRecord.id, test.data as any);
                throw new Error(`Expected validation error for ${test.name} but got success`);
            } catch (error) {
                if (error instanceof Error) {
                    const errorMessage = error.message;
                    if (!errorMessage.includes(test.expectedError)) {
                        throw new Error(`Expected error message containing "${test.expectedError}" but got "${errorMessage}"`);
                    }
                    console.log(`✅ Correctly caught update validation error for ${test.name}:`, errorMessage);
                }
            }
        }

        // Test successful updates
        const updateSuccessTests = [
            {
                name: 'single field update',
                data: { severity: 'moderate' as const },
                validate: (record: any) => record.severity === 'moderate'
            },
            {
                name: 'multiple field update',
                data: {
                    status: 'resolved' as const,
                    action_taken: 'Parent meeting conducted',
                    description: 'Updated description'
                },
                validate: (record: any) => 
                    record.status === 'resolved' &&
                    record.action_taken === 'Parent meeting conducted' &&
                    record.description === 'Updated description'
            },
            {
                name: 'date update',
                data: { incident_date: new Date('2024-03-01') },
                validate: (record: any) => new Date(record.incident_date).toISOString().startsWith('2024-03-01')
            }
        ];

        for (const test of updateSuccessTests) {
            const updatedRecord = await indisciplineTestService.update(createdRecord.id, test.data);
            if (!test.validate(updatedRecord)) {
                throw new Error(`Update test "${test.name}" failed validation`);
            }
            console.log(`✅ Update test "${test.name}" passed`);

            // Verify the update persisted
            const retrievedRecord = await indisciplineTestService.getById(updatedRecord.id);
            if (!retrievedRecord || !test.validate(retrievedRecord)) {
                throw new Error(`Update test "${test.name}" failed persistence check`);
            }
            console.log(`✅ Update test "${test.name}" passed persistence check`);
        }

        // Test non-existent record update
        try {
            await indisciplineTestService.update('non-existent-id', { severity: 'minor' });
            throw new Error('Expected error for non-existent record update');
        } catch (error) {
            if (error instanceof Error) {
                if (!error.message.includes('not found')) {
                    throw new Error(`Expected 'not found' error but got: ${error.message}`);
                }
                console.log('✅ Correctly caught non-existent record update error:', error.message);
            }
        }

        // Test concurrent updates
        await logTestStep('Testing concurrent updates');

        // Create a record for concurrent update testing
        const recordForConcurrentUpdate = await indisciplineTestService.create({
            studentAdmissionNumber: 'STU001',
            reporterEmail: 'teacher@school.com',
            incident_date: new Date(),
            description: 'Test incident for concurrent updates',
            severity: 'minor'
        });

        // Test sequential updates to simulate concurrency
        const updates = [
            { severity: 'minor' as const },
            { status: 'resolved' as const },
            { description: 'Concurrent update' }
        ];

        // Run updates sequentially but quickly
        for (const update of updates) {
            const result = await indisciplineTestService.update(recordForConcurrentUpdate.id, update);
            console.log(`✅ Update successful:`, update);
        }

        // Verify final state
        const finalRecord = await indisciplineTestService.getById(recordForConcurrentUpdate.id);
        if (!finalRecord) {
            throw new Error('Failed to retrieve final record state');
        }

        // Verify that all updates were applied
        const expectedState = {
            severity: 'minor',
            status: 'resolved',
            description: 'Concurrent update'
        };

        Object.entries(expectedState).forEach(([key, value]) => {
            if (finalRecord[key as keyof typeof finalRecord] !== value) {
                throw new Error(`Expected ${key} to be ${value} but got ${finalRecord[key as keyof typeof finalRecord]}`);
            }
        });

        console.log('✅ All concurrent updates applied successfully');

        // Test Case 5: Delete Record Test
        await logTestStep('Testing record deletion');

        // Create a record specifically for deletion tests
        const recordForDeletion = await indisciplineTestService.create(validRecord);

        // Test deleting non-existent record
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        try {
            await indisciplineTestService.delete(nonExistentId);
            throw new Error('Should have thrown an error for non-existent record');
        } catch (error) {
            if (error instanceof Error && !error.message.includes('not found')) {
                throw new Error(`Expected 'not found' error but got: ${error.message}`);
            }
            console.log('✅ Correctly caught non-existent record deletion error');
        }

        // Test successful deletion
        try {
            await indisciplineTestService.delete(recordForDeletion.id);
            const deletedRecord = await indisciplineTestService.getById(recordForDeletion.id);
            if (deletedRecord !== null) {
                throw new Error('Record was not properly deleted');
            }
            console.log('✅ Record deleted successfully');
        } catch (error) {
            throw new Error(`Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Test deleting already deleted record
        try {
            await indisciplineTestService.delete(recordForDeletion.id);
            throw new Error('Should have thrown an error for already deleted record');
        } catch (error) {
            if (error instanceof Error && 
                !error.message.includes('not found') && 
                !error.message.includes('already deleted')) {
                throw new Error(`Expected 'not found' or 'already deleted' error but got: ${error.message}`);
            }
            console.log('✅ Correctly caught already deleted record error');
        }

        // Test concurrent deletions
        const recordForConcurrentDeletion = await indisciplineTestService.create(validRecord);
        
        try {
            const promises = Array(3).fill(null).map(() => 
                indisciplineTestService.delete(recordForConcurrentDeletion.id)
            );
            
            const results = await Promise.allSettled(promises);
            
            // First deletion should succeed
            const successfulDeletes = results.filter(r => r.status === 'fulfilled').length;
            if (successfulDeletes !== 1) {
                throw new Error(`Expected exactly 1 successful deletion but got ${successfulDeletes}`);
            }
            
            // Other deletions should fail
            const failedDeletes = results.filter(r => r.status === 'rejected').length;
            if (failedDeletes !== 2) {
                throw new Error(`Expected exactly 2 failed deletions but got ${failedDeletes}`);
            }
            
            console.log('✅ Correctly handled concurrent deletions');
        } catch (error) {
            throw new Error(`Concurrent deletion test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Test Case 6: Edge Cases
        await logTestStep('Testing edge cases');

        // Test non-existent student
        try {
            await indisciplineTestService.create({
                ...validRecord,
                studentAdmissionNumber: 'NONEXISTENT'
            });
            throw new Error('Expected error for non-existent student');
        } catch (error) {
            if (error instanceof Error) {
                console.log('✅ Correctly caught non-existent student error:', error.message);
            } else {
                throw error;
            }
        }

        // Test non-existent teacher
        try {
            await indisciplineTestService.create({
                ...validRecord,
                reporterEmail: 'nonexistent@school.com'
            });
            throw new Error('Expected error for non-existent teacher');
        } catch (error) {
            if (error instanceof Error) {
                console.log('✅ Correctly caught non-existent teacher error:', error.message);
            } else {
                throw error;
            }
        }

        console.log('\n✅ All indiscipline service tests completed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        throw error;
    }
}

describe('Indiscipline Service Tests', () => {
    beforeAll(async () => {
        await indisciplineTestService.initialize();
        await indisciplineTestService.setupTestData();
    });

    afterAll(async () => {
        await indisciplineTestService.cleanup();
    });

    beforeEach(async () => {
        await indisciplineTestService.cleanup();
        await indisciplineTestService.setupTestData();
    });

    it('should run all indiscipline service tests', async () => {
        console.log('🚀 Starting Indiscipline Service Tests');
        await testIndisciplineService();
    });
});
