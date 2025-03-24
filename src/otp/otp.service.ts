import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async generateOtp(email: string): Promise<void> {
    await this.checkCooldown(email); // Check email-based cooldown first

    const otp: string = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP

    //TODO: Send Email & Implement proper Notifications System

    await Promise.all([
      this.cacheManager.set(`otp:${email}`, otp, 1000 * 60 * 5), // Store OTP for 5 min
      this.setCooldown(email), // Set 1 min email-based cooldown after generating OTP
      this.resetFailedAttempts(email), // Reset previous OTP Failed Attempts Counter if exists
    ]);
  }

  async verifyOtp(email: string, inputOTP: string): Promise<void> {
    await this.checkFailedAttempts(email); // Check for too many failed attempts

    const storedOTP: string | null = await this.cacheManager.get(
      `otp:${email}`,
    );

    if (!storedOTP) {
      await this.incrementFailedAttempts(email);
      throw new UnauthorizedException('Invalid or expired OTP!');
    }

    // Prevent Timing Attack by comaparing using crypto.timingSafeEqual rather than equality comparison
    const inputBuffer = Buffer.from(inputOTP);
    const storedBuffer = Buffer.from(storedOTP);

    if (inputBuffer.length !== storedBuffer.length) {
      await this.incrementFailedAttempts(email);
      throw new UnauthorizedException('Invalid or expired OTP!');
    }

    const match = crypto.timingSafeEqual(inputBuffer, storedBuffer);

    if (match) {
      await Promise.all([
        this.cacheManager.set(`otp:${email}`, null, 0), // .del Method not working in Redis older version. Hence Workaround
        this.resetFailedAttempts(email), // On successful verification, reset failed attempts
        this.resetCooldown(email), // On successful verification, clear the generate otp cooldown
      ]);
    } else {
      await this.incrementFailedAttempts(email);
      throw new UnauthorizedException('Invalid or expired OTP!');
    }
  }

  private async checkCooldown(email: string): Promise<void> {
    const cooldownKey = `cooldown:${email}`;
    const hasActiveCooldown: string | null =
      await this.cacheManager.get(cooldownKey);

    if (hasActiveCooldown) {
      throw new BadRequestException(
        'Please wait at least 60 seconds before requesting another OTP',
      );
    }
  }

  private async setCooldown(email: string): Promise<void> {
    const cooldownKey = `cooldown:${email}`;
    await this.cacheManager.set(cooldownKey, true, 1000 * 60); // Set Cooldown for 1 min
  }

  private async resetCooldown(email: string): Promise<void> {
    const cooldownKey = `cooldown:${email}`;
    await this.cacheManager.set(cooldownKey, null, 0); // Clear the generate otp cooldown
  }

  private async checkFailedAttempts(email: string): Promise<void> {
    const attemptsKey = `otp-attempts:${email}`;
    const attempts: number = (await this.cacheManager.get(attemptsKey)) || 0;

    if (attempts >= 5) {
      await this.resetCooldown(email); // Clear the generate otp cooldown

      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }
  }

  private async incrementFailedAttempts(email: string): Promise<void> {
    const attemptsKey = `otp-attempts:${email}`;
    const attempts: number = (await this.cacheManager.get(attemptsKey)) || 0;

    await this.cacheManager.set(attemptsKey, attempts + 1, 1000 * 60 * 5); // Increment and store with 5 min expiry
  }

  private async resetFailedAttempts(email: string): Promise<void> {
    const attemptsKey = `otp-attempts:${email}`;
    await this.cacheManager.set(attemptsKey, 0, 0); // Delete the key
  }
}
