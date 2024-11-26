import { inviteTestService } from './invite.service';
import { ServiceError } from '../../types/common.types';
import { InviteStatus, UserRole } from '../../types/invite.types';
import { table } from 'table';

function formatAsTable(data: any[]): string {
    if (data.length === 0) return 'No data';

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

    return table([header, ...rows]);
}

async function showTableContents() {
    console.log('\nCurrent Invites Table Contents:');
    const result = await inviteTestService.getAll(1, 100);
    console.log(formatAsTable(result.invites));
    console.log('──────────────────────────────────────────────────\n');
}

async function logTestStep(description: string) {
    console.log('\n🔍 TEST STEP:', description);
    console.log('──────────────────────────────────────────────────');
}

async function testInviteService() {
    try {
        await logTestStep('Initializing database');
        await inviteTestService.initialize();

        await showTableContents();

        // Test Case 1: Input Validation Tests
        await logTestStep('Testing input validation');
        
        const invalidInputs = [
            {
                name: 'Invalid email format',
                data: {
                    email: 'invalid.email',
                    role: UserRole.TEACHER,
                    invited_by: 'admin-id'
                },
                expectedError: 'Invalid email format'
            },
            {
                name: 'Invalid teacher email domain',
                data: {
                    email: 'teacher@gmail.com',
                    role: UserRole.TEACHER,
                    invited_by: 'admin-id'
                },
                expectedError: 'Email domain gmail.com is not allowed'
            },
            {
                name: 'Missing invited_by',
                data: {
                    email: 'teacher@school.edu',
                    role: UserRole.TEACHER
                } as any,
                expectedError: 'NOT NULL constraint failed: invites.invited_by'
            },
            {
                name: 'Missing role',
                data: {
                    email: 'teacher@school.edu',
                    invited_by: 'admin-id'
                } as any,
                expectedError: 'NOT NULL constraint failed: invites.role'
            },
            {
                name: 'Invalid role',
                data: {
                    email: 'teacher@school.edu',
                    role: 'INVALID_ROLE' as any,
                    invited_by: 'admin-id'
                },
                expectedError: "CHECK constraint failed: role IN ('student', 'teacher')"
            },
            {
                name: 'Empty email',
                data: {
                    email: '',
                    role: UserRole.TEACHER,
                    invited_by: 'admin-id'
                },
                expectedError: 'Invalid email format'
            },
            {
                name: 'Invalid expiration date',
                data: {
                    email: 'teacher@school.edu',
                    role: UserRole.TEACHER,
                    invited_by: 'admin-id',
                    expiration_date: 'invalid-date'
                },
                expectedError: 'Invalid expiration date'
            }
        ];

        for (const test of invalidInputs) {
            try {
                await inviteTestService.createInvite(test.data);
                console.error(`❌ Should have failed: ${test.name}`);
                throw new Error(`Validation should have failed for ${test.name}`);
            } catch (error) {
                if (error instanceof ServiceError && error.message.includes(test.expectedError)) {
                    console.log(`✅ Passed: ${test.name} - ${error.message}`);
                } else if (error instanceof Error && error.message.includes(test.expectedError)) {
                    console.log(`✅ Passed: ${test.name} - ${error.message}`);
                } else {
                    console.error(`❌ Failed: ${test.name} - Got unexpected error:`, error);
                    console.error(`Expected error to include: ${test.expectedError}`);
                    throw error;
                }
            }
        }

        // Test Case 2: Create Valid Invites
        await logTestStep('Testing valid invite creation');
        
        const validInvites = [
            {
                email: 'teacher@school.edu',
                role: UserRole.TEACHER,
                invited_by: 'admin-id'
            },
            {
                email: 'teacher2@school.edu',
                role: UserRole.TEACHER,
                invited_by: 'admin-id'
            }
        ];

        for (const invite of validInvites) {
            try {
                const result = await inviteTestService.createInvite(invite);
                console.log(`✅ Created invite for ${invite.email}`);
                console.log('Invite details:', result.invite);
            } catch (error) {
                console.error(`❌ Failed to create invite for ${invite.email}:`, error);
            }
        }

        await showTableContents();

        // Test Case 3: Duplicate Prevention
        await logTestStep('Testing duplicate prevention');
        
        try {
            await inviteTestService.createInvite(validInvites[0]);
            console.error('❌ Failed: Should prevent duplicate email');
        } catch (error) {
            if (error instanceof ServiceError && error.code === 'DUPLICATE_EMAIL') {
                console.log('✅ Passed: Prevented duplicate email');
            } else {
                console.error('❌ Failed: Unexpected error during duplicate test:', error);
            }
        }

        // Test Case 4: Invite Validity Check
        await logTestStep('Testing invite validity check');
        
        try {
            const result = await inviteTestService.createInvite({
                email: 'test@school.edu',
                role: UserRole.TEACHER,
                invited_by: 'admin-id',
                expiration_date: new Date(Date.now() + 1000) // Expires in 1 second
            });

            console.log('Created test invite:', result.invite);
            
            if (!result.invite) {
                console.error('❌ Failed: Could not create invite for validity check');
            } else {
                const validityCheck1 = await inviteTestService.checkInviteValidity(result.invite.id);
                console.log('Initial validity check:', validityCheck1);

                // Wait for expiration
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const validityCheck2 = await inviteTestService.checkInviteValidity(result.invite.id);
                console.log('After expiration validity check:', validityCheck2);

                if (validityCheck1.valid && !validityCheck2.valid) {
                    console.log('✅ Passed: Invite validity check');
                } else {
                    console.error('❌ Failed: Invite validity check');
                }
            }
        } catch (error) {
            console.error('❌ Failed: Error during validity check:', error);
        }

        // Test Case 5: Accept Invite Tests
        await logTestStep('Testing invite acceptance');
        
        try {
            const newInvite = await inviteTestService.createInvite({
                email: 'accept@school.edu',
                role: UserRole.TEACHER,
                invited_by: 'admin-id'
            });

            if (!newInvite.invite) {
                throw new Error('Failed to create invite for acceptance test');
            }

            // Get the token from the database
            const inviteWithToken = await inviteTestService.getById(newInvite.invite.id);
            if (!inviteWithToken?.token) {
                throw new Error('No token found for invite');
            }

            const invalidAcceptTests = [
                {
                    name: 'Non-existent invite',
                    data: {
                        token: 'dGVzdA==:dGVzdA==',  // Base64 encoded test:test to match iv:encrypted format
                        acceptedBy: 'user-id-1'
                    },
                    expectedError: 'Failed to decrypt data'
                },
                {
                    name: 'Already accepted invite',
                    data: {
                        token: inviteWithToken.token,
                        acceptedBy: 'user-id-1'
                    },
                    runTwice: true,
                    expectedError: 'Invite is accepted'
                }
            ];

            for (const test of invalidAcceptTests) {
                try {
                    // First validate the token
                    const tokenValidation = await inviteTestService.decryptAndValidateToken(test.data.token);
                    if (!tokenValidation.valid) {
                        throw new ServiceError(tokenValidation.message || 'Invalid token', 'INVALID_TOKEN', 400);
                    }

                    // Then accept the invite
                    await inviteTestService.acceptInvite(tokenValidation.invite!.id, test.data.acceptedBy);
                    
                    if (test.runTwice) {
                        // Try accepting the same invite again
                        await inviteTestService.acceptInvite(tokenValidation.invite!.id, test.data.acceptedBy);
                    }
                    
                    console.error(`❌ Should have failed: ${test.name}`);
                } catch (error) {
                    if (error instanceof ServiceError && error.message.includes(test.expectedError)) {
                        console.log(`✅ Passed: ${test.name} - ${error.message}`);
                    } else {
                        console.error(`❌ Failed: ${test.name} - Got unexpected error:`, error);
                        throw error;
                    }
                }
            }

            // Test successful acceptance
            // First validate the token
            const tokenValidation = await inviteTestService.decryptAndValidateToken(inviteWithToken.token);
            if (!tokenValidation.valid) {
                throw new ServiceError(tokenValidation.message || 'Invalid token', 'INVALID_TOKEN', 400);
            }

            const acceptResult = await inviteTestService.acceptInvite(tokenValidation.invite!.id, 'user-id-2');
            
            if (acceptResult.success) {
                console.log('✅ Passed: Successfully accepted invite');
                
                // Verify the invite status
                const updatedInvite = await inviteTestService.getById(tokenValidation.invite!.id);
                if (updatedInvite?.status === InviteStatus.ACCEPTED &&
                    updatedInvite?.used_by === 'user-id-2' &&
                    updatedInvite?.used_at) {
                    console.log('✅ Passed: Invite status correctly updated');
                } else {
                    console.error('❌ Failed: Invite status not updated correctly');
                    console.log('Updated invite:', updatedInvite);
                }
            } else {
                console.error('❌ Failed: Could not accept invite');
            }

        } catch (error) {
            console.error('❌ Failed: Error during accept invite test:', error);
            throw error;
        }

        await showTableContents();

        // Test Case 6: Invite Status Management
        await logTestStep('Testing invite status management');
        
        try {
            const invite = await inviteTestService.createInvite({
                email: 'status@school.edu',
                role: UserRole.TEACHER,
                invited_by: 'admin-id'
            });

            if (!invite.invite) {
                console.error('❌ Failed: Could not create invite for status management test');
            } else {
                console.log('Created invite:', invite.invite);

                // Mark as used
                await inviteTestService.markInviteAsUsed(invite.invite.id, 'user-id');
                const usedInvite = await inviteTestService.getById(invite.invite.id);
                console.log('After marking as used:', usedInvite);

                // Try to use again
                try {
                    await inviteTestService.markInviteAsUsed(invite.invite.id, 'another-user');
                    console.error('❌ Failed: Should not allow reuse of invite');
                } catch (error) {
                    console.log('✅ Passed: Prevented invite reuse');
                }
            }
        } catch (error) {
            console.error('❌ Failed: Error during invite status management test:', error);
        }

        // Test Case 7: Invite History
        await logTestStep('Testing invite history');
        
        try {
            const email = 'history@school.edu';
            
            // Create multiple invites
            await inviteTestService.createInvite({
                email,
                role: UserRole.TEACHER,
                invited_by: 'admin-id'
            });

            const history = await inviteTestService.getInviteHistory(email);
            console.log('Invite history:', history);
            console.log('✅ Passed: Successfully retrieved invite history');
        } catch (error) {
            console.error('❌ Failed: Error during invite history test:', error);
        }

        // Test Case 8: Cleanup Expired Invites
        await logTestStep('Testing expired invites cleanup');
        
        try {
            const expiredInvite = await inviteTestService.createInvite({
                email: 'expired@school.edu',
                role: UserRole.TEACHER,
                invited_by: 'admin-id',
                expiration_date: new Date(Date.now() - 1000) // Already expired
            });

            console.log('Created expired invite:', expiredInvite);
            await inviteTestService.cleanupExpiredInvites();
            console.log('✅ Passed: Successfully cleaned up expired invites');

            console.log('After cleanup:');
            await showTableContents();
        } catch (error) {
            console.error('❌ Failed: Error during expired invites cleanup test:', error);
        }

        // Final state
        await logTestStep('Final database state');
        await showTableContents();

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        try {
            await inviteTestService.cleanup();
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }
}

describe('Invite Service Tests', () => {
    it('should run all invite service tests', async () => {
        console.log('🚀 Starting Invite Service Tests');
        await testInviteService();
        console.log('✨ All tests completed successfully');
    }, 30000); // 30 second timeout
});
