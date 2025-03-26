import { Body, Controller, Post, Version } from '@nestjs/common';
import { OtpService } from './otp.service';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { CompanyEmailOtpDto } from './dtos/company-email-otp.dto';
import { EmailOtpDto } from './dtos/email-otp.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';

@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService: OtpService,
    private readonly configService: ConfigService,
  ) {}

  // For Users that require company domain emails
  @Version('1')
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // One request per minute
  @Post('companyEmail')
  async companyEmailOtp(@Body() body: CompanyEmailOtpDto) {
    const otp = await this.otpService.issueOtp('email', body?.email);

    return {
      data: this.configService.get<string>('NODE_ENV')?.includes('local')
        ? { otp }
        : null,
      message: 'Please check your Email Inbox and Enter OTP Code!',
    };
  }

  // For Users that don't require company domain emails
  @Version('1')
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // One request per minute
  @Post('email')
  async emailOtp(@Body() body: EmailOtpDto) {
    const otp = await this.otpService.issueOtp('email', body?.email);

    return {
      data: this.configService.get<string>('NODE_ENV')?.includes('local')
        ? { otp }
        : null,
      message: 'Please check your Email Inbox and Enter OTP Code!',
    };
  }

  //  No real use of this request handler (Just for testing purposes)
  //  this.otpService.verifyOtp() will be called by other services as a verification step before some other code is executed
  @Version('1')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Five requests per minute to allow retries
  @Post('verify')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    await this.otpService.verifyOtp(
      (body?.email || body?.phoneNumber || body?.deviceId) as string,
      body?.otp,
    );

    return {
      data: { verified: true },
      message: 'OTP verified successfully!',
    };
  }
}
