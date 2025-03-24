import { Transform } from 'class-transformer';
import { IsEmail, Length } from 'class-validator';
import validator from 'validator';

export class OtpRequestDto {
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
}
