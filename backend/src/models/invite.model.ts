import { z } from 'zod';
import { UserRole } from '../middlewares/auth.middleware';

// Convert UserRole enum to union type for Zod
type UserRoleType = `${UserRole}`;
const userRoles: [UserRoleType, ...UserRoleType[]] = [
  'student' as UserRoleType,
  'teacher' as UserRoleType,
  'admin' as UserRoleType
];

export const InviteSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(userRoles),
  status: z.enum(['pending', 'accepted', 'expired']),
  invited_by: z.string().uuid(),
  accepted_by: z.string().uuid().optional(),
  created_at: z.date(),
  accepted_at: z.date().optional(),
  expiration_date: z.date().optional()
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
  status: string;
  invited_by: string;
  accepted_by?: string;
  created_at: string;
  accepted_at?: string;
  expiration_date?: string;
}
