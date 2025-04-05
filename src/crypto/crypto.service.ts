import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { scrypt as _scrypt } from 'crypto';

const scrypt = promisify(_scrypt);

@Injectable()
export class CryptoService {
  private readonly ENCRYPTION_ALGORITHM: string;
  private readonly KEY_DERIVATION_SECRET: string;
  private readonly PBKDF2_ITERATIONS: number;
  private readonly ENCRYPTION_KEY_LENGTH: number;
  private readonly IV_LENGTH: number;

  constructor(private readonly configService: ConfigService) {
    this.ENCRYPTION_ALGORITHM = this.configService.get<string>(
      'ENCRYPTION_ALGORITHM',
    ) as string;
    this.KEY_DERIVATION_SECRET = this.configService.get<string>(
      'KEY_DERIVATION_SECRET',
    ) as string;
    this.PBKDF2_ITERATIONS = Number(
      this.configService.get<string>('PBKDF2_ITERATIONS'),
    );
    this.ENCRYPTION_KEY_LENGTH = Number(
      this.configService.get<string>('ENCRYPTION_KEY_LENGTH'),
    );
    this.IV_LENGTH = Number(this.configService.get<string>('IV_LENGTH'));
  }

  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = (await scrypt(password, salt, 32)) as Buffer;
    return `${salt}:${hashedPassword.toString('hex')}`;
  }

  async comparePassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const [salt, storedHashedPassword] = storedHash.split(':');
    const hashedPassword = (await scrypt(password, salt, 32)) as Buffer;
    return hashedPassword.toString('hex') === storedHashedPassword;
  }

  encryptPasswordWithDerivedKey(
    password: string,
    contextIdentifier: string = '',
  ) {
    const salt = crypto.randomBytes(16).toString('hex'); // Generate a random salt. Ensures even if two tenants have the same password, their encryption keys will be different
    const key = this.deriveKey(
      this.KEY_DERIVATION_SECRET + contextIdentifier,
      salt,
    ); // Derive Encryption key
    const iv = crypto.randomBytes(this.IV_LENGTH); // Generate a random IV. Ensures each encryption output is unique

    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    let encryptedPassword = cipher.update(password, 'utf8', 'hex');
    encryptedPassword += cipher.final('hex');

    return { encryptedPassword, salt, iv: iv.toString('hex') }; // Store encryptedPassword, salt, and IV in DB
  }

  decryptPasswordWithDerivedKey(
    encryptedPassword: string,
    salt: string,
    ivHex: string,
    contextIdentifier: string = '',
  ) {
    const key = this.deriveKey(
      this.KEY_DERIVATION_SECRET + contextIdentifier,
      salt,
    ); // Derive key
    const iv = Buffer.from(ivHex, 'hex'); // Convert IV back to Buffer

    const decipher = crypto.createDecipheriv(
      this.ENCRYPTION_ALGORITHM,
      key,
      iv,
    );
    let decryptedPassword = decipher.update(encryptedPassword, 'hex', 'utf8');
    decryptedPassword += decipher.final('utf8');

    return decryptedPassword;
  }

  // Derives a strong secure key for encryption / decryption of Tenant Login Password
  private deriveKey(keyMaterial: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(
      keyMaterial,
      salt,
      this.PBKDF2_ITERATIONS,
      this.ENCRYPTION_KEY_LENGTH, // Dependent upon the ENCRYPTION_ALGORITHM
      'sha256',
    );
  }
}
