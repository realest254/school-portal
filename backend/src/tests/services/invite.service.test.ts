import { 
    InviteTestService,
    InviteError,
    DomainError,
    SpamError
} from './invite.service';
import { UserRole, InviteStatus, Invite, CreateInviteDto } from '../../types/invite.types';
import { TestRateLimiter, RateLimitError } from '../mocks/rate-limiter.mock';
import { table } from 'table';

const inviteTestService = InviteTestService.getInstance();

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
    const invites = await inviteTestService.getAllInvites();
    console.log('\n=== Current Invites State ===');
    console.log(formatAsTable(invites));
    console.log('\n===========================');
}

async function logTestStep(description: string) {
    console.log(`\n🔍 TEST STEP: ${description}`);
    console.log('─'.repeat(50));
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
                name: 'Missing @ Symbol Email',
                data: {
                    email: 'invalid.email',
                    role: UserRole.STUDENT,
                    invited_by: 'admin@school.edu'
                }
            },
            {
                name: 'Missing Domain Email',
                data: {
                    email: 'test@',
                    role: UserRole.STUDENT,
                    invited_by: 'admin@school.edu'
                }
            },
            {
                name: 'Invalid Domain Email',
                data: {
                    email: 'test@invalid.com',
                    role: UserRole.STUDENT,
                    invited_by: 'admin@school.edu'
                }
            },
            {
                name: 'Empty Email',
                data: {
                    email: '',
                    role: UserRole.STUDENT,
                    invited_by: 'admin@school.edu'
                }
            },
            {
                name: 'Invalid Role',
                data: {
                    email: 'test@school.edu',
                    role: 'INVALID_ROLE' as UserRole,
                    invited_by: 'admin@school.edu'
                }
            },
            {
                name: 'Missing Inviter',
                data: {
                    email: 'test@school.edu',
                    role: UserRole.STUDENT,
                    invited_by: ''
                }
            }
        ];

        for (const test of invalidInputs) {
            try {
                await inviteTestService.createInvite(test.data);
                console.error(`❌ Should have failed: ${test.name}`);
                throw new Error(`Validation should have failed for ${test.name}`);
            } catch (error) {
                if (error instanceof InviteError || error instanceof DomainError) {
                    console.log(`✅ Correctly caught validation error for ${test.name}:`, error.message);
                } else {
                    throw error;
                }
            }
        }

        // Test Case 2: Create Valid Invite
        await logTestStep('Testing valid invite creation');
        const createResult = await inviteTestService.createInvite({
            email: 'student@school.edu',
            role: UserRole.STUDENT,
            invited_by: 'admin@school.edu'
        });

        if (!createResult.invite) {
            throw new Error('Failed to create invite');
        }

        console.log('Created invite:', formatAsTable([createResult.invite]));
        
        // Test Case 3: Invite Acceptance
        await logTestStep('Testing invite acceptance');
        
        console.log('\n📌 Testing invite acceptance...');
        console.log('Original invite details:');
        console.table({
            id: createResult.invite.id,
            email: createResult.invite.email,
            role: createResult.invite.role,
            status: createResult.invite.status,
            invited_by: createResult.invite.invited_by
        });

        const acceptingUser = 'accepted_by@school.edu';
        console.log('\n👤 User accepting invite:', acceptingUser);

        const acceptResult = await inviteTestService.acceptInvite(
            createResult.invite.id,
            createResult.invite.email,
            UserRole.STUDENT,
            acceptingUser
        );

        if (!acceptResult.invite) {
            throw new Error('Failed to accept invite');
        }

        console.log('\n✅ Invite accepted successfully!');
        console.log('Updated invite details:');
        console.table({
            id: acceptResult.invite.id,
            email: acceptResult.invite.email,
            role: acceptResult.invite.role,
            status: acceptResult.invite.status,
            invited_by: acceptResult.invite.invited_by,
            accepted_by: acceptResult.invite.accepted_by,
            accepted_at: acceptResult.invite.accepted_at
        });
        
        // Test Case 4: Edge Cases
        await logTestStep('Testing edge cases');
        
        // 4.1 Expired invite
        console.log('\n📌 Testing expired invite...');
        const expiredInvite = await inviteTestService.createInvite({
            email: 'expired@school.edu',
            role: UserRole.STUDENT,
            invited_by: 'admin@school.edu'
        });

        if (!expiredInvite.invite) {
            throw new Error('Failed to create expired invite');
        }

        // Force invite to be expired by directly updating the database
        await new Promise<void>((resolve, reject) => {
            inviteTestService['db'].run(
                `UPDATE invites 
                 SET created_at = datetime('now', '-8 days'),
                     expires_at = datetime('now', '-1 day')
                 WHERE id = ?`,
                [expiredInvite.invite!.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        
        try {
            await inviteTestService.acceptInvite(
                expiredInvite.invite.id,
                'expired@school.edu',
                UserRole.STUDENT,
                'accepted_by@school.edu'
            );
            throw new Error('Should have failed: Expired invite');
        } catch (error) {
            if (error instanceof InviteError) {
                console.log('✅ Correctly caught expired invite error:', error.message);
            } else {
                throw error;
            }
        }

        // 4.2 Already accepted invite
        console.log('\n📌 Testing already accepted invite...');
        try {
            await inviteTestService.acceptInvite(
                createResult.invite.id,
                'student@school.edu',
                UserRole.STUDENT,
                'accepted_by@school.edu'
            );
            throw new Error('Should have failed: Already accepted invite');
        } catch (error) {
            if (error instanceof InviteError) {
                console.log('✅ Correctly caught already accepted invite error:', error.message);
            } else {
                throw error;
            }
        }

        // 4.3 Email mismatch
        console.log('\n📌 Testing email mismatch...');
        const newInvite = await inviteTestService.createInvite({
            email: 'correct@school.edu',
            role: UserRole.STUDENT,
            invited_by: 'admin@school.edu'
        });
        
        if (!newInvite.invite) {
            throw new Error('Failed to create invite for email mismatch test');
        }

        try {
            await inviteTestService.acceptInvite(
                newInvite.invite.id,
                'wrong@school.edu',
                UserRole.STUDENT,
                'accepted_by@school.edu'
            );
            throw new Error('Should have failed: Email mismatch');
        } catch (error) {
            if (error instanceof InviteError) {
                console.log('✅ Correctly caught email mismatch error:', error.message);
            } else {
                throw error;
            }
        }

        // Test Case 5: Rate Limiting
        await logTestStep('Testing rate limiting');
        
        // Reset rate limits before testing
        TestRateLimiter.resetLimits();
        
        // 5.1 IP-based rate limiting
        console.log('\n📌 Testing IP-based rate limiting...');
        const testIP = '192.168.1.1';
        const IP_RATE_LIMIT = 5; // Maximum allowed invites per IP
        for (let i = 0; i < IP_RATE_LIMIT + 1; i++) {
            try {
                await inviteTestService.createInvite({
                    email: `test${i}@school.edu`,
                    role: UserRole.STUDENT,
                    invited_by: 'admin@school.edu'
                }, testIP);
                if (i >= IP_RATE_LIMIT) {
                    throw new Error('Should have failed: IP rate limit exceeded');
                }
                console.log(`✅ Created invite ${i + 1}/${IP_RATE_LIMIT}`);
            } catch (error) {
                if (error instanceof RateLimitError && i >= IP_RATE_LIMIT) {
                    console.log('✅ Correctly caught IP rate limit error:', error.message);
                    break;
                } else {
                    throw error;
                }
            }
        }

        // Reset rate limits before next test
        TestRateLimiter.resetLimits();

        // 5.2 Email-based rate limiting
        console.log('\n📌 Testing email-based rate limiting...');
        const testEmail = 'ratelimit@school.edu';
        const EMAIL_RATE_LIMIT = 3; // Maximum allowed invites per email
        for (let i = 0; i < EMAIL_RATE_LIMIT + 1; i++) {
            try {
                await inviteTestService.createInvite({
                    email: testEmail,
                    role: UserRole.STUDENT,
                    invited_by: 'admin@school.edu'
                });
                if (i >= EMAIL_RATE_LIMIT) {
                    throw new Error('Should have failed: Email rate limit exceeded');
                }
                console.log(`✅ Created invite ${i + 1}/${EMAIL_RATE_LIMIT} for ${testEmail}`);
            } catch (error) {
                if (error instanceof RateLimitError) {
                    console.log('✅ Correctly caught email rate limit error:', error.message);
                    break;
                } else {
                    throw error;
                }
            }
        }

        // Show final database state
        await logTestStep('Final database state');
        await showTableContents();

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

describe('Invite Service Tests', () => {
    it('should run all invite service tests', async () => {
        console.log('🚀 Starting Invite Service Tests');
        await testInviteService();
    });
});
