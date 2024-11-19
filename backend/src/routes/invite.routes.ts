import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();
const inviteController = new InviteController();

// Create a single invite (admin/teacher only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  inviteController.createInvite
);

// Create multiple invites (admin/teacher only)
router.post(
  '/bulk',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  inviteController.createBulkInvites
);

// Check invite validity (public)
router.get('/:id/check', inviteController.checkInvite);

// Mark invite as used (requires auth)
router.post(
  '/:id/use',
  authMiddleware,
  inviteController.markInviteAsUsed
);

export default router;
