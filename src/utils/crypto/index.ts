import * as crypto from 'crypto';

// Generate a random secure string (password / id) (16 characters)
export function generateRandomString(length = 16): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}
