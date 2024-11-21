import { Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { CreateInviteDTO, Invite } from '../models/invite.model';
import { sendInviteEmail } from '../utils/email';
import { UserRole } from '../middlewares/auth.middleware';
import { decrypt } from '../utils/encryption';

// Define result types for bulk invites
interface BulkInviteResults {
  successful: Invite[];
  failed: Array<{
    email: string;
    reason: string;
  }>;
}

export class InviteController {
  private inviteService: InviteService;

  constructor() {
    this.inviteService = new InviteService();
  }

  createInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role } = req.body as CreateInviteDTO;
      const userId = (req as any).user.id;

      // Validate email domain
      const domainValidation = await this.inviteService.validateEmailDomain(email, role);
      if (!domainValidation.valid) {
        res.status(400).json({ error: domainValidation.message || 'Invalid email domain' });
        return;
      }

      // Check for spam
      const spamCheck = await this.inviteService.checkInviteSpam(email);
      if (spamCheck.isSpam) {
        res.status(400).json({ error: spamCheck.message || 'Too many invite attempts' });
        return;
      }

      // Create invite with expiration date
      const invite = await this.inviteService.createInvite({
        email,
        role,
        invited_by: userId
      });

      await sendInviteEmail(invite);
      res.status(201).json(invite);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invite';
      res.status(400).json({ error: message });
    }
  };

  createBulkInvites = async (req: Request, res: Response): Promise<void> => {
    try {
      const { emails, role } = req.body;
      const userId = (req as any).user.id;

      if (!Array.isArray(emails)) {
        res.status(400).json({ error: 'Emails must be an array' });
        return;
      }

      const results: BulkInviteResults = {
        successful: [],
        failed: []
      };

      for (const email of emails) {
        try {
          // Validate email domain
          const domainValidation = await this.inviteService.validateEmailDomain(email, role);
          if (!domainValidation.valid) {
            results.failed.push({ email, reason: domainValidation.message || 'Invalid email domain' });
            continue;
          }

          // Check for spam
          const spamCheck = await this.inviteService.checkInviteSpam(email);
          if (spamCheck.isSpam) {
            results.failed.push({ email, reason: spamCheck.message || 'Too many invite attempts' });
            continue;
          }

          // Create invite
          const invite = await this.inviteService.createInvite({
            email,
            role,
            invited_by: userId
          });

          await sendInviteEmail(invite);
          results.successful.push(invite);
        } catch (error) {
          results.failed.push({
            email,
            reason: error instanceof Error ? error.message : 'Failed to create invite'
          });
        }
      }

      res.status(201).json(results);
    } catch (error) {
      res.status(400).json({ error: 'Failed to process bulk invites' });
    }
  };

  checkInviteValidity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.inviteService.checkInviteValidity(id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Failed to check invite validity' });
    }
  };

  markInviteAsUsed = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User ID is required' });
        return;
      }

      await this.inviteService.markInviteAsUsed(id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: 'Failed to mark invite as used' });
    }
  };

  validateEmailDomain = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role } = req.body;
      const result = await this.inviteService.validateEmailDomain(email, role);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Failed to validate email domain' });
    }
  };

  checkInviteSpam = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.inviteService.checkInviteSpam(email);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Failed to check invite spam' });
    }
  };

  resendInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const userId = (req as any).user.id;
      const invite = await this.inviteService.resendInvite(email, userId);
      await sendInviteEmail(invite);
      res.json(invite);
    } catch (error) {
      res.status(400).json({ error: 'Failed to resend invite' });
    }
  };

  getInviteHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.query as { email: string };
      const history = await this.inviteService.getInviteHistory(email);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: 'Failed to get invite history' });
    }
  };

  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Valid token string is required' });
        return;
      }

      const result = await this.inviteService.validateToken(token);
      
      if (!result.valid) {
        res.status(400).json({ 
          error: 'Invalid token',
          reason: result.reason
        });
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Failed to validate token' });
    }
  };
}
