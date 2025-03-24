import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import validator from 'validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(6, 100, {
    message: 'Email must be between 6 and 100 characters',
  })
  // Type check inside Transform because Transform runs before other checks
  // Normalize and sanitize email
  @Transform(({ value }) =>
    typeof value === 'string'
      ? validator.normalizeEmail(value?.trim()?.toLowerCase())
      : value,
  )
  email: string;

  @IsString({ message: 'OTP must be a string' })
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP must be exactly 6 digits',
  })
  otp: string;
}
