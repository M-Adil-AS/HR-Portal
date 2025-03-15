import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches } from 'class-validator';
import { IsCompanyDomain } from 'src/validators/company-domain.validator';
import validator from 'validator';

export class RegisterCompanyDto {
  //TODO: Company Name Length Check in DB & TypeORM Entity & Dto
  @IsString({
    message: 'Company Name must be string',
  })
  // Must be validated to avoid SQL Injection Attack as it is used in raw SQL query rather than TypeORM queries which perform parameterization by default
  @Matches(/^[a-zA-Z ]+$/, {
    message: 'Company Name must only contain letters and spaces',
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
  // Type check inside Transform because Transform runs before other checks
  // Normalize and sanitize email
  @Transform(({ value }) =>
    typeof value === 'string'
      ? validator.normalizeEmail(value?.trim()?.toLowerCase())
      : value,
  )
  adminEmail: string;
}
