import * as crypto from 'crypto';

// Generate a random secure string (password / id) (16 characters)
export function generateRandomString(length = 16): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}
