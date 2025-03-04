import { IsEmail, IsString } from 'class-validator';
import { IsCompanyDomain } from 'src/validators/company-domain.validator';

export class RegisterCompanyDto {
  @IsString({
    message: 'Company Name must be string',
  })
  companyName: string;

  @IsEmail()
  @IsCompanyDomain({
    message: 'Please use the company email, not a personal email',
  })
  adminEmail: string;
}
