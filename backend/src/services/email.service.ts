import { supabase } from '../lib/supabase';
import { encrypt } from '../utils/encryption';
import { Invite, InviteToken, getTokenString } from '../types/invite.types';

interface EmailTemplate {
  subject: string;
  body: string;
}

export class EmailService {
  private static instance: EmailService;
  private readonly templates: Record<string, EmailTemplate>;
  private readonly isTestEnvironment: boolean;

  private constructor() {
    this.isTestEnvironment = process.env.NODE_ENV === 'test';
    this.templates = {
      studentInvite: {
        subject: 'Welcome to School Portal - Student Invitation',
        body: `
          <h1>Welcome to School Portal!</h1>
          <p>You've been invited to join School Portal as a student.</p>
          <p>Click the button below to complete your registration:</p>
          <a href="{{signupUrl}}" style="
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          ">Complete Registration</a>
          <p>This invite will expire in 7 days.</p>
        `
      },
      teacherInvite: {
        subject: 'Welcome to School Portal - Teacher Invitation',
        body: `
          <h1>Welcome to School Portal!</h1>
          <p>You've been invited to join School Portal as a teacher.</p>
          <p>Click the button below to complete your registration:</p>
          <a href="{{signupUrl}}" style="
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 16px 0;
          ">Complete Registration</a>
          <p>This invite will expire in 7 days.</p>
        `
      }
    };
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getTemplate(role: string): EmailTemplate {
    const templateKey = `${role.toLowerCase()}Invite`;
    const template = this.templates[templateKey];
    if (!template) {
      throw new Error(`No email template found for role: ${role}`);
    }
    return template;
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce((text, [key, value]) => {
      return text.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, template);
  }

  public async sendInviteEmail(
    invite: Invite,
    token: InviteToken,
    frontendUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In test environment, just log and return success
      if (this.isTestEnvironment) {
        console.log('Test environment: Skipping email send for invite:', {
          email: invite.email,
          role: invite.role,
          token: getTokenString(token)
        });
        return { success: true };
      }

      // Get the appropriate template
      const template = this.getTemplate(invite.role);

      // Create signup URL with token
      const signupUrl = `${frontendUrl}/auth/signup?token=${getTokenString(token)}`;

      // Replace template variables
      const htmlContent = this.replaceTemplateVariables(template.body, {
        signupUrl
      });

      // Send email using Supabase
      const { error } = await supabase.auth.api.sendEmail(invite.email, {
        subject: template.subject,
        html: htmlContent,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to send invite email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send invite email' 
      };
    }
  }
}

export const emailService = EmailService.getInstance();
