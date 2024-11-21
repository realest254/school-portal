import { Router } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { InviteController } from '../controllers/invite.controller';
import { RequestHandler } from 'express';

const router = Router();
const inviteController = InviteController.getInstance();

// Apply authentication middleware
router.use(verifyToken);
router.use(requireRole(UserRole.ADMIN));

// Create invite
router.post('/', (inviteController.createInvite as RequestHandler));

// Create bulk invites
router.post('/bulk', (inviteController.createBulkInvites as RequestHandler));

// Check invite validity
router.get('/:id/check', (inviteController.checkInviteValidity as RequestHandler));

// Mark invite as used
router.post('/:id/use', (inviteController.markInviteAsUsed as RequestHandler));

// Validate email domain
router.post('/validate-domain', (inviteController.validateEmailDomain as RequestHandler));

// Check invite spam
router.post('/check-spam', (inviteController.checkInviteSpam as RequestHandler));

// Resend invite
router.post('/resend', (inviteController.resendInvite as RequestHandler));

// Get invite history
router.get('/history/:email', (inviteController.getInviteHistory as RequestHandler));

export default router;
