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

  validateInvite = async (req: Request, res: Response): Promise<void> => {
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

      // Get client IP for rate limiting
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      const result = await this.inviteService.validateInvite(token, clientIp);
      res.json(result);
    } catch (error) {
      logError(error, 'validateInvite');
      res.status(400).json({ 
        valid: false, 
        reason: 'error',
        message: error instanceof Error ? error.message : 'Failed to validate invite'
      });
    }
  };

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

  acceptInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, email, role } = req.body;
      const userId = (req as any).user.id;

      if (!id || !email || !role) {
        res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
        return;
      }

      const result = await this.inviteService.acceptInvite({ id, email, role }, userId);
      res.json(result);
    } catch (error) {
      logError(error, 'acceptInvite');
      res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to accept invite'
      });
    }
  };

  getInviteHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const history = await this.inviteService.getInviteHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: 'Failed to get invite history' });
    }
  };

  resendInvite = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const result = await this.inviteService.resendInvite(id, userId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Failed to resend invite' });
    }
  };
}
