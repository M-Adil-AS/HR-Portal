import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { NormalizeEmail } from 'src/decorators/transformers';
import { TrimAndLowerCase } from 'src/decorators/transformers';
import { IsCompanyDomain } from 'src/decorators/validators';

export class RegisterCompanyDto {
  @IsString({
    message: 'Company Name must be string',
  })
  // Must be validated to avoid SQL Injection Attack as it is used in raw SQL query rather than TypeORM queries which perform parameterization by default
  @Matches(/^[a-zA-Z ]+$/, {
    message: 'Company Name must only contain letters and spaces',
  })
  @Length(3, 50, {
    message: 'Company Name must be between 3 and 50 characters',
  })
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  companyName: string;

  @IsString({
    message: 'User Name must be string',
  })
  @Matches(/^[a-zA-Z ]+$/, {
    message: 'User Name must only contain letters and spaces',
  })
  @Length(3, 50, {
    message: 'User Name must be between 3 and 50 characters',
  })
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  userName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsCompanyDomain({
    message: 'Please use the company email, not a personal email',
  })
  @Length(6, 100, {
    message: 'Email must be between 6 and 100 characters',
  })
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @NormalizeEmail() // Normalize and sanitize email. Transformers are executed in order (TrimAndLowerCase first then NormalizeEmail)
  email: string;

  @IsString({
    message: 'OTP must be string',
  })
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  otp: string;
}
