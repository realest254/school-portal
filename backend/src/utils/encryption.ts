import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-encryption-key-min-32-chars!!';
const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    
    // Return iv:encrypted in base64
    return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(token: string): string {
  try {
    const [ivString, encryptedString] = token.split(':');
    if (!ivString || !encryptedString) {
      throw new Error('Invalid token format');
    }

    const iv = Buffer.from(ivString, 'base64');
    const encrypted = Buffer.from(encryptedString, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}
