import {
  Equals,
  IsEmail,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { NormalizeEmail } from 'src/decorators/transformers';
import { TrimAndLowerCase } from 'src/decorators/transformers';
import { IsCompanyDomain } from 'src/decorators/validators';

// Validators throw Errors in order: bottom to up

export class RegisterCompanyDto {
  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @Length(3, 50, {
    message: 'Company Name must be between 3 and 50 characters',
  })
  // Must be validated to avoid SQL Injection Attack as it is used in raw SQL query rather than TypeORM queries which perform parameterization by default
  @Matches(/^[a-zA-Z ]+$/, {
    message: 'Company Name must only contain letters and spaces',
  })
  @IsString({
    message: 'Company Name must be string',
  })
  companyName: string;

  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @Length(3, 50, {
    message: 'User Name must be between 3 and 50 characters',
  })
  @Matches(/^[a-zA-Z ]+$/, {
    message: 'User Name must only contain letters and spaces',
  })
  @IsString({
    message: 'User Name must be string',
  })
  userName: string;

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

  @TrimAndLowerCase() // Type check inside TrimAndLowerCase() because Transform runs before other Validator checks
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  @IsString({
    message: 'OTP must be string',
  })
  otp: string;

  @IsStrongPassword(
    {
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must contain atleast one lowercase, uppercase, number and a special character',
    },
  )
  @MinLength(8, { message: 'Password must contain atleast 8 characters' })
  @IsString({ message: 'Password must be a string' })
  password: string;

  @ValidateIf((o) => o.password !== o.confirmPassword)
  @Equals('password', { message: 'Passwords must match!' })
  @IsString({ message: 'Confirm Password must be a string' })
  confirmPassword: string;
}
