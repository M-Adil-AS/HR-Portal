import * as crypto from 'crypto';

// Generate a random secure password (16 characters)
export function generateRandomPassword(length = 16): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

//TODO: Move global in env
//TODO: Compare against algo in docs

const ALGORITHM = 'aes-256-cbc'; // AES encryption algorithm
const ITERATIONS = 10000; // PBKDF2 iteration count (higher = more secure)
const KEY_LENGTH = 32; // 256-bit key
const IV_LENGTH = 16; // IV must be 16 bytes

// Generates a strong encryption key for the tenant
export function generateTenantKey(
  dbName: string,
  secretKey: string,
  salt: string,
): Buffer {
  return crypto.pbkdf2Sync(
    secretKey + dbName,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256',
  );
}

export function encryptPassword(
  password: string,
  dbName: string,
  secretKey: string,
) {
  const salt = crypto.randomBytes(16).toString('hex'); // Generate a random salt. Ensures even if two tenants have the same password, their encryption keys will be different
  const key = generateTenantKey(dbName, secretKey, salt); // Derive Encryption key
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV. Ensures each encryption output is unique

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encryptedPassword = cipher.update(password, 'utf8', 'hex');
  encryptedPassword += cipher.final('hex');

  return { encryptedPassword, salt, iv: iv.toString('hex') }; // Store encryptedPassword, salt, and IV in DB
}

export function decryptPassword(
  encryptedPassword: string,
  dbName: string,
  salt: string,
  ivHex: string,
  secretKey: string,
) {
  const key = generateTenantKey(dbName, secretKey, salt); // Derive key
  const iv = Buffer.from(ivHex, 'hex'); // Convert IV back to Buffer

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decryptedPassword = decipher.update(encryptedPassword, 'hex', 'utf8');
  decryptedPassword += decipher.final('utf8');

  return decryptedPassword;
}
