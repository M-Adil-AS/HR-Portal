import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import { NotificationService } from 'src/notification/notification.service';
import { v4 as uuidv4 } from 'uuid';

/*
  Throttling only rate-limits the requests per IP-basis
  Same recipient can issueOtp or verifyOtp multiple times if IP is different in every request
  Hence rate liming is applied per recipeint-basis
*/

@Injectable()
export class OtpService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly notificationService: NotificationService,
  ) {}

  async issueOtp(
    type: 'email' | 'sms' | 'push' | 'whatsapp',
    recipient: string,
  ): Promise<string> {
    await this.checkCooldown(recipient); // Check recipeint-based (email/phone/push) cooldown first

    const otp: string = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP

    //TODO: Implement proper Notification System and send Notification based on type
    if (type === 'email') {
      await this.notificationService.dispatch({
        id: uuidv4(),
        type,
        link: null,
        isRead: false,
        isActioned: false,
        sendTo: [recipient],
        action: 'emailVerification',
        entityType: 'user',
        createdBy: recipient,
        createdAt: new Date(),
        data: { otp },
      });
    }

    await Promise.all([
      this.cacheManager.set(`otp:${recipient}`, otp, 1000 * 60 * 5), // Store OTP for 5 min
      this.setCooldown(recipient), // Set 1 min recipeint-based (email/phone/push) cooldown after generating OTP
      this.resetFailedAttempts(recipient), // Reset previous OTP Failed Attempts Counter if exists
    ]);

    return otp;
  }

  async verifyOtp(recipient: string, inputOTP: string): Promise<void> {
    await this.checkFailedAttempts(recipient); // Check for too many failed attempts

    const storedOTP: string | null = await this.cacheManager.get(
      `otp:${recipient}`,
    );

    if (!storedOTP) {
      await this.incrementFailedAttempts(recipient);
      throw new UnauthorizedException('Invalid or expired OTP!');
    }

    // Prevent Timing Attack by comaparing using crypto.timingSafeEqual rather than equality comparison
    const inputBuffer = Buffer.from(inputOTP);
    const storedBuffer = Buffer.from(storedOTP);

    if (inputBuffer.length !== storedBuffer.length) {
      await this.incrementFailedAttempts(recipient);
      throw new UnauthorizedException('Invalid or expired OTP!');
    }

    const match = crypto.timingSafeEqual(inputBuffer, storedBuffer);

    if (match) {
      await Promise.all([
        this.cacheManager.set(`otp:${recipient}`, null, 0), // .del Method not working in Redis older version. Hence Workaround
        this.resetFailedAttempts(recipient), // On successful verification, reset failed attempts
        this.resetCooldown(recipient), // On successful verification, clear the generate otp cooldown
      ]);
    } else {
      await this.incrementFailedAttempts(recipient);
      throw new UnauthorizedException('Invalid or expired OTP!');
    }
  }

  private async checkCooldown(recipient: string): Promise<void> {
    const cooldownKey = `otp-cooldown:${recipient}`;
    const hasActiveCooldown: string | null =
      await this.cacheManager.get(cooldownKey);

    if (hasActiveCooldown) {
      throw new BadRequestException(
        'Please wait at least 60 seconds before requesting another OTP',
      );
    }
  }

  private async setCooldown(recipient: string): Promise<void> {
    const cooldownKey = `otp-cooldown:${recipient}`;
    await this.cacheManager.set(cooldownKey, true, 1000 * 60); // Set Cooldown for 1 min
  }

  private async resetCooldown(recipient: string): Promise<void> {
    const cooldownKey = `otp-cooldown:${recipient}`;
    await this.cacheManager.set(cooldownKey, null, 0); // Clear the generate otp cooldown
  }

  private async checkFailedAttempts(recipient: string): Promise<void> {
    const attemptsKey = `otp-attempts:${recipient}`;
    const attempts: number = (await this.cacheManager.get(attemptsKey)) || 0;

    if (attempts >= 5) {
      await this.resetCooldown(recipient); // Clear the generate otp cooldown

      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }
  }

  private async incrementFailedAttempts(recipient: string): Promise<void> {
    const attemptsKey = `otp-attempts:${recipient}`;
    const attempts: number = (await this.cacheManager.get(attemptsKey)) || 0;

    await this.cacheManager.set(attemptsKey, attempts + 1, 1000 * 60 * 5); // Increment and store with 5 min expiry
  }

  private async resetFailedAttempts(recipient: string): Promise<void> {
    const attemptsKey = `otp-attempts:${recipient}`;
    await this.cacheManager.set(attemptsKey, 0, 0); // Delete the key
  }
}
