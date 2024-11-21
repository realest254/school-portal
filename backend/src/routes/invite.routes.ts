import { Router } from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware';
import { InviteController } from '../controllers/invite.controller';

const router = Router();
const inviteController = InviteController.getInstance();

// Apply authentication middleware
router.use(verifyToken);
router.use(requireRole(['admin']));

// Create invite
router.post('/', inviteController.createInvite);

// Create bulk invites
router.post('/bulk', inviteController.createBulkInvites);

// Check invite validity
router.get('/:id/check', inviteController.checkInviteValidity);

// Mark invite as used
router.post('/:id/use', inviteController.markInviteAsUsed);

// Validate email domain
router.post('/validate-domain', inviteController.validateEmailDomain);

// Check invite spam
router.post('/check-spam', inviteController.checkInviteSpam);

// Resend invite
router.post('/resend', inviteController.resendInvite);

// Get invite history
router.get('/history/:email', inviteController.getInviteHistory);

// Validate token
router.post('/validate-token', inviteController.validateToken);

export default router;
