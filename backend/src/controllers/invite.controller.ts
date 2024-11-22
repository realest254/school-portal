import { Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { CreateInviteDTO } from '../models/invite.model';
import { sendInviteEmail } from '../utils/email';
import { logError } from '../utils/logger';

interface BulkInviteResults {
  successful: any[];
  failed: Array<{
    email: string;
    error: string;
  }>;
}

export class InviteController {
  private inviteService: InviteService;

  constructor() {
    this.inviteService = InviteService.getInstance();
  }

  createInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role } = req.body as CreateInviteDTO;
      const userId = (req as any).user.id;

      const result = await this.inviteService.createInvite({
        email,
        role,
        invited_by: userId
      });

      if (!result.success || !result.invite) {
        throw new Error(result.message || 'Failed to create invite');
      }

      res.status(201).json(result);
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
          const result = await this.inviteService.createInvite({
            email,
            role,
            invited_by: userId
          });

          if (result.success && result.invite) {
            results.successful.push(result.invite);
          } else {
            results.failed.push({
              email,
              error: result.message || 'Failed to create invite'
            });
          }
        } catch (error) {
          results.failed.push({
            email,
            error: error instanceof Error ? error.message : 'Failed to create invite'
          });
        }
      }

      res.status(201).json(results);
    } catch (error) {
      res.status(400).json({ error: 'Failed to process bulk invites' });
    }
  };

  decryptInviteToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ 
          valid: false, 
          reason: 'invalid',
          message: 'Valid token string is required' 
        });
        return;
      }

      const result = await this.inviteService.decryptAndValidateToken(token);
      res.json(result);
    } catch (error) {
      logError(error, 'decryptInviteToken');
      const message = error instanceof Error ? error.message : 'Failed to decrypt invite token';
      res.status(400).json({ 
        valid: false, 
        reason: 'error',
        message 
      });
    }
  };

  acceptInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { inviteId, email, role } = req.body;
      
      if (!inviteId || !email || !role) {
        res.status(400).json({ error: 'Invite ID, email, and role are required' });
        return;
      }

      const result = await this.inviteService.acceptInvite({
        id: inviteId,
        email,
        role
      });

      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept invite';
      res.status(400).json({ error: message });
    }
  };

  resendInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const userId = (req as any).user.id;
      const result = await this.inviteService.resendInvite(email, userId);
      
      if (!result.success || !result.invite) {
        throw new Error(result.message || 'Failed to resend invite');
      }
      
      res.json(result);
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
}
