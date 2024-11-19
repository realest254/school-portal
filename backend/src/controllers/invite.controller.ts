import { Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { CreateInviteSchema } from '../models/invite.model';
import { sendInviteEmail } from '../utils/email';

export class InviteController {
  private inviteService: InviteService;

  constructor() {
    this.inviteService = new InviteService();
  }

  async createInvite(req: Request, res: Response) {
    try {
      const data = CreateInviteSchema.parse(req.body);
      const userId = req.user.id;

      // Validate email domain
      const domainValidation = await this.inviteService.validateEmailDomain(data.email, data.role);
      if (!domainValidation.valid) {
        return res.status(400).json(domainValidation);
      }

      // Check for spam
      const spamCheck = await this.inviteService.checkInviteSpam(data.email);
      if (spamCheck.isSpam) {
        return res.status(400).json(spamCheck);
      }

      const invite = await this.inviteService.createInvite(data, userId);
      await sendInviteEmail(invite);
      
      res.status(201).json(invite);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async createBulkInvites(req: Request, res: Response) {
    try {
      const { emails, role } = req.body;
      const userId = req.user.id;

      // Validate all email domains
      const invalidEmails = [];
      for (const email of emails) {
        const domainValidation = await this.inviteService.validateEmailDomain(email, role);
        if (!domainValidation.valid) {
          invalidEmails.push({ email, reason: domainValidation.message });
        }
      }

      if (invalidEmails.length > 0) {
        return res.status(400).json({ error: 'INVALID_DOMAINS', invalidEmails });
      }

      // Check for spam for all emails
      const spamEmails = [];
      for (const email of emails) {
        const spamCheck = await this.inviteService.checkInviteSpam(email);
        if (spamCheck.isSpam) {
          spamEmails.push({ email, ...spamCheck });
        }
      }

      if (spamEmails.length > 0) {
        return res.status(400).json({ error: 'SPAM_DETECTED', spamEmails });
      }

      const invites = await this.inviteService.createBulkInvites(emails, role, userId);
      
      // Send emails in parallel
      await Promise.all(invites.map(invite => sendInviteEmail(invite)));
      
      res.status(201).json(invites);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async checkInviteValidity(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.inviteService.checkInviteValidity(id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markInviteAsUsed(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.inviteService.markInviteAsUsed(id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async validateEmailDomain(req: Request, res: Response) {
    try {
      const { email, role } = req.body;
      const result = await this.inviteService.validateEmailDomain(email, role);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async checkInviteSpam(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await this.inviteService.checkInviteSpam(email);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async resendInvite(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const invite = await this.inviteService.resendInvite(email);
      await sendInviteEmail(invite);
      res.json(invite);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getInviteHistory(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const history = await this.inviteService.getInviteHistory(email);
      res.json(history);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
