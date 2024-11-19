import { z } from 'zod';

export const InviteSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['student', 'teacher', 'admin']),
  createdAt: z.date(),
  expiresAt: z.date(),
  used: z.boolean(),
  createdBy: z.string().uuid()
});

export type Invite = z.infer<typeof InviteSchema>;

export interface CreateInviteDTO {
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface InviteResponse {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  createdBy: string;
}
