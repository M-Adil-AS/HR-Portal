import { Body, Controller, Post } from '@nestjs/common';
import { RegisterCompanyDto } from './dtos/register-company.dto';
import { CompanyService } from './company.service';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { CompanyDto } from './dtos/company.dto';

//TODO: Apply Versioning
@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  //TODO: Add Captcha
  @Serialize(CompanyDto)
  @Post()
  async registerCompany(@Body() body: RegisterCompanyDto) {
    const company = await this.companyService.register(body);

    return { data: company, message: 'Successfully registered!' };
  }
}
