import * as crypto from 'crypto';

// Generate a random secure password (16 characters)
export function generateSecurePassword(length = 16): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}
