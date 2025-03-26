import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { NormalizeEmail } from 'src/decorators/transformers';
import { TrimAndLowerCase } from 'src/decorators/transformers';

export class VerifyOtpDto {
  @ValidateIf((o) => !o.phoneNumber && !o.deviceId) // Validate only if phoneNumber & deviceId don't exist
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(6, 100, {
    message: 'Email must be between 6 and 100 characters',
  })
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @NormalizeEmail() // Normalize and sanitize email. Transformers are executed in order (TrimAndLowerCase first then NormalizeEmail)
  email?: string; // Optional because there might be phoneNumber or deviceId provided instead of email

  @ValidateIf((o) => !o.email && !o.deviceId) // Validate only if email & deviceId don't exist
  @IsPhoneNumber(undefined, { message: 'Invalid phone number format' })
  phoneNumber?: string; // Optional because there might be email or deviceId provided instead of phoneNumber

  @ValidateIf((o) => !o.phoneNumber && !o.email) // Validate only if email & phoneNumber don't exist
  @IsString({ message: 'Device Id is required' })
  @Length(32, 255, {
    message: 'Device Id must be between 32 and 255 characters',
  })
  deviceId?: string; // Optional because there might be email or phoneNumber provided instead of deviceId

  @IsString({ message: 'OTP must be a string' })
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP must be exactly 6 digits',
  })
  otp: string;
}
