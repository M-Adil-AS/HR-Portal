import { Body, Controller, Post, Version } from '@nestjs/common';
import { OtpService } from './otp.service';
import { CompanyOtpRequestDto } from './dtos/company-otp-request.dto';
import { OtpRequestDto } from './dtos/otp-request.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('otp')
export class OtpController {
  constructor(private otpService: OtpService) {}

  // For Users that require company domain emails
  @Version('1')
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // One request per minute
  @Post('generate/company')
  async generateCompanyOtp(@Body() body: CompanyOtpRequestDto) {
    const otp = await this.otpService.generateOtp(body?.email);

    return {
      data: { otp },
      message: 'OTP Generated!',
    };
  }

  // Doesn't require company domain emails
  @Version('1')
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // One request per minute
  @Post('generate')
  async generateOtp(@Body() body: OtpRequestDto) {
    const otp = await this.otpService.generateOtp(body?.email);

    return {
      data: { otp },
      message: 'OTP Generated!',
    };
  }

  // Doesn't require company domain emails
  @Version('1')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Five requests per minute to allow retries
  @Post('verify')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    await this.otpService.verifyOtp(body?.email, body?.otp);

    return {
      data: { verified: true },
      message: 'OTP verified successfully!',
    };
  }
}
