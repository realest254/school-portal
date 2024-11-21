import nodemailer from 'nodemailer';
import { Invite } from '../models/invite.model';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInviteEmail(invite: Invite): Promise<void> {
  const inviteUrl = `${process.env.FRONTEND_URL}/register?invite=${invite.id}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: invite.email,
    subject: 'Invitation to Join School Portal',
    html: `
      <h1>Welcome to School Portal</h1>
      <p>You have been invited to join School Portal as a ${invite.role}.</p>
      <p>Click the link below to complete your registration:</p>
      <a href="${inviteUrl}">${inviteUrl}</a>
      <p>This invite will expire in 7 days.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}