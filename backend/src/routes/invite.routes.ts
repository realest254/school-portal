import { Router, Request, Response } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { InviteController } from '../controllers/invite.controller';

const router = Router();
const inviteController = new InviteController();

// Validate token (public route)
router.post('/validate-token', inviteController.validateToken);

// Apply authentication middleware
router.use(verifyToken);
router.use(requireRole(UserRole.ADMIN));

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

// Get invite history
router.get('/history', inviteController.getInviteHistory);

// Resend invite
router.post('/:id/resend', inviteController.resendInvite);

export default router;
