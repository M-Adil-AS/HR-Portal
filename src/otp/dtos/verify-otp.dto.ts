import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { NormalizeEmail } from 'src/decorators/transformers';
import { TrimAndLowerCase } from 'src/decorators/transformers';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(6, 100, {
    message: 'Email must be between 6 and 100 characters',
  })
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @NormalizeEmail() // Normalize and sanitize email. Transformers are executed in order (TrimAndLowerCase first then NormalizeEmail)
  email: string;

  @IsString({ message: 'OTP must be a string' })
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP must be exactly 6 digits',
  })
  otp: string;
}
