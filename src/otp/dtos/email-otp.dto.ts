import { IsEmail, Length } from 'class-validator';
import { NormalizeEmail } from 'src/decorators/transformers';
import { TrimAndLowerCase } from 'src/decorators/transformers';

// Validators throw Errors in order: bottom to up

export class EmailOtpDto {
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @NormalizeEmail() // Normalize and sanitize email. Transformers are executed in order (TrimAndLowerCase first then NormalizeEmail)
  @Length(6, 100, {
    message: 'Email must be between 6 and 100 characters',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
