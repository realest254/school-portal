import { z } from 'zod';
import { UserRole, InviteStatus } from '../types/invite.types';

export const InviteSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(InviteStatus),
  invited_by: z.string().uuid(),
  accepted_by: z.string().uuid().nullable(),
  created_at: z.date(),
  accepted_at: z.date().nullable(),
  expiration_date: z.date(),
  updated_at: z.date()
});

export type Invite = z.infer<typeof InviteSchema>;

// Update CreateInviteSchema to include expiration_date and invited_by
export const CreateInviteSchema = InviteSchema.pick({
  email: true,
  role: true,
  invited_by: true,
  expiration_date: true
});

export type CreateInviteDTO = z.infer<typeof CreateInviteSchema>;

export interface InviteResponse {
  id: string;
  email: string;
  role: UserRole;
  status: InviteStatus;
  invited_by: string;
  accepted_by?: string;
  created_at: string;
  accepted_at?: string;
  expiration_date: string;
  updated_at: string;
}
