import { Body, Controller, Post, Version } from '@nestjs/common';
import { RegisterCompanyDto } from './dtos/register-company.dto';
import { CompanyService } from './company.service';
import { Serialize } from 'src/decorators/interceptors';
import { CompanyDto } from './dtos/company.dto';

@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  //TODO: Add Captcha
  //TODO: Refactor to add userName, Otp
  @Serialize(CompanyDto)
  @Version('1')
  @Post()
  async registerCompany(@Body() body: RegisterCompanyDto) {
    const company = await this.companyService.register(body);

    return { data: company, message: 'Successfully registered!' };
  }
}
