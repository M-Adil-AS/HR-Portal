import { IsEmail, Length } from 'class-validator';
import { NormalizeEmail } from 'src/decorators/transformers';
import { TrimAndLowerCase } from 'src/decorators/transformers';

export class OtpRequestDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @Length(6, 100, {
    message: 'Email must be between 6 and 100 characters',
  })
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @NormalizeEmail() // Normalize and sanitize email. Transformers are executed in order (TrimAndLowerCase first then NormalizeEmail)
  email: string;
}
