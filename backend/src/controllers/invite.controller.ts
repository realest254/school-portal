import { Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { CreateInviteDTO, Invite } from '../models/invite.model';
import { sendInviteEmail } from '../utils/email';
import { UserRole } from '../middlewares/auth.middleware';
import { ParamsDictionary } from 'express-serve-static-core';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request<ParamsDictionary, any, any> {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Define result types for bulk invites
interface BulkInviteResults {
  successful: Invite[];
  failed: Array<{
    email: string;
    reason: string;
  }>;
}

export class InviteController {
  private static instance: InviteController;
  private inviteService: InviteService;

  private constructor() {
    this.inviteService = new InviteService();
    
    // Bind all methods
    this.createInvite = this.createInvite.bind(this);
    this.createBulkInvites = this.createBulkInvites.bind(this);
    this.checkInviteValidity = this.checkInviteValidity.bind(this);
    this.markInviteAsUsed = this.markInviteAsUsed.bind(this);
    this.validateEmailDomain = this.validateEmailDomain.bind(this);
    this.checkInviteSpam = this.checkInviteSpam.bind(this);
    this.resendInvite = this.resendInvite.bind(this);
    this.getInviteHistory = this.getInviteHistory.bind(this);
  }

  public static getInstance(): InviteController {
    if (!InviteController.instance) {
      InviteController.instance = new InviteController();
    }
    return InviteController.instance;
  }

  public async createInvite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, role } = req.body as CreateInviteDTO;
      const userId = req.user.id;

      // Validate email domain
      const domainValidation = await this.inviteService.validateEmailDomain(email, role);
      if (!domainValidation.valid) {
        res.status(400).json({ error: domainValidation.message });
        return;
      }

      // Check for spam
      const spamCheck = await this.inviteService.checkInviteSpam(email);
      if (spamCheck.isSpam) {
        res.status(400).json({ error: spamCheck.message });
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
  }

  public async createBulkInvites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { emails, role } = req.body;
      const userId = req.user.id;

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
          const domainValidation = await this.inviteService.validateEmailDomain(email, role);
          if (!domainValidation.valid) {
            results.failed.push({ email, reason: domainValidation.message || 'Invalid domain' });
            continue;
          }

          const spamCheck = await this.inviteService.checkInviteSpam(email);
          if (spamCheck.isSpam) {
            results.failed.push({ email, reason: spamCheck.message || 'Spam detected' });
            continue;
          }

          const invite = await this.inviteService.createInvite({
            email,
            role,
            invited_by: userId,
            expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
      const message = error instanceof Error ? error.message : 'Failed to create bulk invites';
      res.status(400).json({ error: message });
    }
  }

  public async checkInviteValidity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.inviteService.checkInviteValidity(id);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check invite validity';
      res.status(400).json({ error: message });
    }
  }

  public async markInviteAsUsed(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.inviteService.markInviteAsUsed(id);
      res.status(200).json({ message: 'Invite marked as used' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark invite as used';
      res.status(400).json({ error: message });
    }
  }

  public async validateEmailDomain(req: Request, res: Response): Promise<void> {
    try {
      const { email, role } = req.body;
      const result = await this.inviteService.validateEmailDomain(email, role);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate email domain';
      res.status(400).json({ error: message });
    }
  }

  public async checkInviteSpam(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const result = await this.inviteService.checkInviteSpam(email);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check invite spam';
      res.status(400).json({ error: message });
    }
  }

  public async resendInvite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const userId = req.user.id;
      const invite = await this.inviteService.resendInvite(email, userId);
      await sendInviteEmail(invite);
      res.json(invite);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend invite';
      res.status(400).json({ error: message });
    }
  }

  public async getInviteHistory(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      const history = await this.inviteService.getInviteHistory(email);
      res.json(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get invite history';
      res.status(400).json({ error: message });
    }
  }
}
