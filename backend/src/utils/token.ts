import { InviteToken } from '../types/invite.types';
import { encrypt, decrypt } from './encryption';

export function createInviteToken(data: InviteToken): string {
  return encrypt(JSON.stringify(data));
}

export function stringToInviteToken(token: string): InviteToken {
  const decrypted = decrypt(token);
  return JSON.parse(decrypted) as InviteToken;
}

export function parseInviteToken(token: string): InviteToken | null {
  try {
    return stringToInviteToken(token);
  } catch (error) {
    return null;
  }
}

export function getTokenString(token: InviteToken): string {
  return createInviteToken(token);
}
