import { 
    NotificationTestService, 
    NotificationError, 
    NotificationErrorCodes,
    type Notification 
} from './notification.service';
import { UserRole } from '../../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
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

async function logTestStep(description: string) {
    console.log(`\n🔍 TEST STEP: ${description}`);
    console.log('─'.repeat(50));
}

async function testNotificationService(notificationTestService: NotificationTestService) {
    try {
        // Wrap all test steps in try-catch to ensure proper error handling
        try {
            // Test Case 1: Validation Tests
            await logTestStep('Testing input validation');
            
            const validationTests = [
                {
                    name: 'Empty title',
                    data: {
                        title: '',
                        message: 'Test message',
                        priority: 'high',
                        target_audience: ['teacher']
                    },
                    expectedError: 'Validation failed'
                },
                {
                    name: 'Missing title',
                    data: {
                        message: 'Test message',
                        priority: 'high',
                        target_audience: ['teacher']
                    },
                    expectedError: 'Validation failed'
                },
                {
                    name: 'Empty message',
                    data: {
                        title: 'Test title',
                        message: '',
                        priority: 'high',
                        target_audience: ['teacher']
                    },
                    expectedError: 'Validation failed'
                },
                {
                    name: 'Invalid priority',
                    data: {
                        title: 'Test title',
                        message: 'Test message',
                        priority: 'invalid',
                        target_audience: ['teacher']
                    },
                    expectedError: 'Validation failed'
                },
                {
                    name: 'Empty target audience',
                    data: {
                        title: 'Test title',
                        message: 'Test message',
                        priority: 'high',
                        target_audience: []
                    },
                    expectedError: 'Validation failed'
                },
                {
                    name: 'Invalid target audience role',
                    data: {
                        title: 'Test title',
                        message: 'Test message',
                        priority: 'high',
                        target_audience: ['invalid_role']
                    },
                    expectedError: 'Validation failed'
                },
                {
                    name: 'Invalid expires_at date',
                    data: {
                        title: 'Test title',
                        message: 'Test message',
                        priority: 'high',
                        target_audience: ['teacher'],
                        expires_at: 'invalid-date'
                    },
                    expectedError: 'Validation failed'
                }
            ];

            for (const test of validationTests) {
                try {
                    console.log(`\n📋 Testing validation: ${test.name}`);
                    await notificationTestService.create(test.data);
                    throw new Error(`Expected validation error for ${test.name} but got success`);
                } catch (error) {
                    if (error instanceof NotificationError) {
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

            // Test Case 2: Edge Cases
            await logTestStep('Testing edge cases');
            
            const edgeCaseTests = [
                {
                    name: 'All target audiences',
                    data: {
                        title: 'Test title',
                        message: 'Test message',
                        priority: 'high',
                        target_audience: ['admin', 'teacher', 'student']
                    },
                    shouldSucceed: true
                },
                {
                    name: 'Far future expiry date',
                    data: {
                        title: 'Test title',
                        message: 'Test message',
                        priority: 'high',
                        target_audience: ['teacher'],
                        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
                    },
                    shouldSucceed: true
                }
            ];

            for (const test of edgeCaseTests) {
                try {
                    console.log(`\n📋 Testing edge case: ${test.name}`);
                    const result = await notificationTestService.create(test.data);
                    if (!test.shouldSucceed) {
                        throw new Error(`Expected edge case error for ${test.name} but got success`);
                    }
                    console.log(`✅ Successfully created notification for edge case ${test.name}:`, formatAsTable([result]));
                } catch (error) {
                    if (test.shouldSucceed) {
                        throw error;
                    }
                    if (error instanceof Error) {
                        console.log(`✅ Correctly caught edge case error for ${test.name}:`, error.message);
                    } else {
                        throw new Error('Unknown error type');
                    }
                }
            }

            // Test Case 3: Filter Validation
            await logTestStep('Testing filter validation');
            
            const filterValidationTests = [
                {
                    name: 'Invalid priority filter',
                    filters: { priority: 'invalid' },
                    expectedError: "Invalid enum value. Expected 'low' | 'medium' | 'high', received 'invalid'"
                },
                {
                    name: 'Invalid status filter',
                    filters: { status: 'invalid' },
                    expectedError: "Invalid enum value. Expected 'active' | 'expired' | 'deleted', received 'invalid'"
                }
            ];

            for (const test of filterValidationTests) {
                try {
                    console.log(`\n📋 Testing filter validation: ${test.name}`);
                    await notificationTestService.getAll(1, 10, test.filters);
                    throw new Error(`Expected filter validation error for ${test.name} but got success`);
                } catch (error) {
                    if (error instanceof NotificationError) {
                        const errorMessage = error.message || 'Unknown error';
                        if (!errorMessage.includes(test.expectedError)) {
                            throw new Error(`Expected error message containing "${test.expectedError}" but got "${errorMessage}"`);
                        }
                        console.log(`✅ Correctly caught filter validation error for ${test.name}:`, errorMessage);
                    } else {
                        throw error;
                    }
                }
            }

            // Test Case 4: Create Notification
            await logTestStep('Testing notification creation');
            const createResult = await notificationTestService.create({
                title: 'Test Notification',
                message: 'This is a test notification',
                priority: 'high',
                target_audience: ['teacher', 'admin'],
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
            });
            
            // Test Case 5: Get All Notifications with Filters
            await logTestStep('Testing get all notifications with filters');
            
            const filterTests = [
                { name: 'Filter by status', filters: { status: 'active' } },
                { name: 'Filter by target audience', filters: { target_audience: 'teacher' } },
                { name: 'Filter by date range', filters: { 
                    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }}
            ];

            for (const test of filterTests) {
                console.log(`\n📋 Testing ${test.name}:`);
                const result = await notificationTestService.getAll(1, 10, test.filters);
                console.log(`Found ${result.notifications.length} notifications:`, formatAsTable(result.notifications));
            }

            // Test Case 6: Get Notification by ID
            await logTestStep('Testing get notification by ID');
            const notification = await notificationTestService.getById(createResult.id);
            console.log('✅ Got notification by ID:', formatAsTable([notification]));
            
            const nonExistentNotification = await notificationTestService.getById('00000000-0000-0000-0000-000000000000');
            console.log('✅ Non-existent notification returns null:', nonExistentNotification === null);

            // Test Case 7: Get Notifications for Recipient
            await logTestStep('Testing get notifications for recipient');
            const recipientTests = [
                { role: 'teacher' as UserRole, userId: uuidv4() },
                { role: 'student' as UserRole, userId: uuidv4() },
                { role: 'admin' as UserRole, userId: uuidv4() }
            ];

            for (const test of recipientTests) {
                console.log(`\n📋 Testing ${test.role} notifications:`);
                const result = await notificationTestService.getForRecipient(test.userId, test.role, 1, 10);
                console.log(`Found ${result.notifications.length} notifications for ${test.role}:`, formatAsTable(result.notifications));
            }

            // Test Case 8: Update Notification
            await logTestStep('Testing notification updates');
            const updateTests = [
                { name: 'Update title', update: { title: 'Updated Title' } },
                { name: 'Update message', update: { message: 'Updated message content' } },
                { name: 'Update priority', update: { priority: 'medium' } },
                { name: 'Update target audience', update: { target_audience: ['admin'] } },
                { name: 'Update status', update: { status: 'expired' } }
            ];

            for (const test of updateTests) {
                console.log(`\n📋 Testing ${test.name}:`);
                const updatedNotification = await notificationTestService.update(createResult.id, test.update);
                console.log('Updated notification:', formatAsTable([updatedNotification]));
            }

            // Test invalid update
            try {
                await notificationTestService.update(createResult.id, { priority: 'invalid' });
            } catch (error) {
                if (error instanceof NotificationError) {
                    console.log('✅ Correctly caught invalid priority error:', error.message);
                } else {
                    throw error;
                }
            }

            // Test Case 9: Delete Notification
            await logTestStep('Testing notification deletion');
            await notificationTestService.delete(createResult.id);
            const deletedNotification = await notificationTestService.getById(createResult.id);
            console.log('✅ Notification deleted successfully:', deletedNotification === null);

            // Test Case 10: Pagination Tests
            await logTestStep('Testing pagination');

            // Create 20 test notifications for pagination testing
            const testNotifications = Array.from({ length: 20 }, (_, i) => ({
                title: `Test Notification ${i + 1}`,
                message: `This is test notification ${i + 1}`,
                priority: ['low', 'medium', 'high'][i % 3] as 'low' | 'medium' | 'high',
                target_audience: ['admin', 'teacher'],
                expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)) // 1 day from now
            }));

            // Create all test notifications
            for (const notification of testNotifications) {
                await notificationTestService.create(notification);
            }

            const paginationTests = [
                { page: 1, limit: 5, expectedCount: 5, description: 'First 5 notifications' },
                { page: 2, limit: 5, expectedCount: 5, description: 'Next 5 notifications' },
                { page: 3, limit: 5, expectedCount: 5, description: 'Next 5 notifications' },
                { page: 4, limit: 5, expectedCount: 5, description: 'Last 5 notifications' },
                { page: 1, limit: 10, expectedCount: 10, description: 'First 10 notifications' },
                { page: 2, limit: 10, expectedCount: 10, description: 'Last 10 notifications' }
            ];

            for (const test of paginationTests) {
                console.log(`\n📋 Testing pagination: ${test.description} (page ${test.page}, limit ${test.limit})`);
                const result = await notificationTestService.getAll(test.page, test.limit, {});
                console.log(`Found ${result.total} total notifications, showing ${result.notifications.length}:`, 
                    formatAsTable(result.notifications));
                
                // Verify pagination results
                if (result.notifications.length !== test.expectedCount) {
                    throw new Error(`Expected ${test.expectedCount} notifications, but got ${result.notifications.length}`);
                }
                if (result.total !== 22) {
                    throw new Error(`Expected total of 20 notifications, but got ${result.total}`);
                }

                // Verify notification order (should be ordered by created_at DESC)
                const isOrderedByCreatedAt = result.notifications.every((notification, index) => {
                    if (index === 0) return true;
                    const prevDate = new Date(result.notifications[index - 1].created_at);
                    const currentDate = new Date(notification.created_at);
                    return prevDate >= currentDate;
                });
                
                if (!isOrderedByCreatedAt) {
                    throw new Error('Notifications are not properly ordered by created_at DESC');
                }
            }

            console.log('\n✅ All notification service tests completed successfully!');
        } catch (error) {
            console.error('❌ Test step failed:', error);
            throw error;
        }
    } catch (error) {
        console.error('❌ Test initialization failed:', error);
        throw error;
    }
}

describe('Notification Service Tests', () => {
    let notificationTestService: NotificationTestService;

    beforeEach(async () => {
        notificationTestService = new NotificationTestService();
        await notificationTestService.initialize();
    });

    afterEach(async () => {
        await notificationTestService.cleanup();
    });

    it('should run all notification tests', async () => {
        await testNotificationService(notificationTestService);
    });
});
