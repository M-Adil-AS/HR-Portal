import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches } from 'class-validator';
import { IsCompanyDomain } from 'src/validators/company-domain.validator';
import validator from 'validator';

export class RegisterCompanyDto {
  @IsString({
    message: 'Company Name must be string',
  })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Company Name must only contain letters, numbers, and underscores',
  })
  companyName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Invalid email format',
  })
  @IsCompanyDomain({
    message: 'Please use the company email, not a personal email',
  })
  @Transform(({ value }) => validator.normalizeEmail(value)) // Normalize and sanitize email
  adminEmail: string;
}
