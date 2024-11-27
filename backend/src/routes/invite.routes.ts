import { Router } from 'express';
import { verifyToken, requireRole, UserRole } from '../middlewares/auth.middleware';
import { InviteController } from '../controllers/invite.controller';

const router = Router();
const inviteController = new InviteController();

// Public routes
router.post('/validate-invite', inviteController.validateInvite); 

// Protected route (any authenticated user)
router.post('/accept', verifyToken, inviteController.acceptInvite);

// Protected routes (admin only)
router.use(verifyToken);
router.use(requireRole(UserRole.ADMIN));

// Create invite
router.post('/', inviteController.createInvite);

// Create bulk invites
router.post('/bulk', inviteController.createBulkInvites);

// Get invite history
router.get('/history', inviteController.getInviteHistory);

export default router;
