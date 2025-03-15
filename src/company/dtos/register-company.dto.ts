import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { IsCompanyDomain } from 'src/validators/company-domain.validator';
import validator from 'validator';

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
  // Type check inside Transform because Transform runs before other checks
  @Transform(({ value }) =>
    typeof value === 'string' ? value?.trim()?.toLowerCase() : value,
  )
  companyName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsCompanyDomain({
    message: 'Please use the company email, not a personal email',
  })
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
  adminEmail: string;
}
