import { IsEmail, Length } from 'class-validator';
import { NormalizeEmail } from 'src/decorators/transformers';
import { TrimAndLowerCase } from 'src/decorators/transformers';
import { IsCompanyDomain } from 'src/decorators/validators';

// Validators throw Errors in order: bottom to up

export class CompanyEmailOtpDto {
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @NormalizeEmail() // Normalize and sanitize email. Transformers are executed in order (TrimAndLowerCase first then NormalizeEmail)
  @Length(6, 100, {
    message: 'Email must be between 6 and 100 characters',
  })
  @IsCompanyDomain({
    message: 'Please use the company email, not a personal email',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
