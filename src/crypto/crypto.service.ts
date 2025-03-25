import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  //TODO: Compare against algo in docs
  //TODO: Make Service Methods Generic

  // Encryption Properties
  private readonly ENCRYPTION_ALGORITHM: string;
  private readonly ENCRYPTION_SECRET: string;
  private readonly PBKDF2_ITERATIONS: number;
  private readonly ENCRYPTION_KEY_LENGTH: number;
  private readonly IV_LENGTH: number;

  constructor(private readonly configService: ConfigService) {
    this.ENCRYPTION_ALGORITHM = this.configService.get<string>(
      'ENCRYPTION_ALGORITHM',
    ) as string;
    this.ENCRYPTION_SECRET = this.configService.get<string>(
      'ENCRYPTION_SECRET',
    ) as string;
    this.PBKDF2_ITERATIONS = Number(
      this.configService.get<string>('PBKDF2_ITERATIONS'),
    );
    this.ENCRYPTION_KEY_LENGTH = Number(
      this.configService.get<string>('ENCRYPTION_KEY_LENGTH'),
    );
    this.IV_LENGTH = Number(this.configService.get<string>('IV_LENGTH'));
  }

  encryptPassword(password: string, dbName: string) {
    const salt = crypto.randomBytes(16).toString('hex'); // Generate a random salt. Ensures even if two tenants have the same password, their encryption keys will be different
    const key = this.generateTenantKey(dbName, this.ENCRYPTION_SECRET, salt); // Derive Encryption key
    const iv = crypto.randomBytes(this.IV_LENGTH); // Generate a random IV. Ensures each encryption output is unique

    const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
    let encryptedPassword = cipher.update(password, 'utf8', 'hex');
    encryptedPassword += cipher.final('hex');

    return { encryptedPassword, salt, iv: iv.toString('hex') }; // Store encryptedPassword, salt, and IV in DB
  }

  decryptPassword(
    encryptedPassword: string,
    dbName: string,
    salt: string,
    ivHex: string,
  ) {
    const key = this.generateTenantKey(dbName, this.ENCRYPTION_SECRET, salt); // Derive key
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

  // Generates a strong encryption key for the tenant
  private generateTenantKey(
    dbName: string,
    secretValue: string,
    salt: string,
  ): Buffer {
    return crypto.pbkdf2Sync(
      secretValue + dbName,
      salt,
      this.PBKDF2_ITERATIONS,
      this.ENCRYPTION_KEY_LENGTH,
      'sha256',
    );
  }
}
