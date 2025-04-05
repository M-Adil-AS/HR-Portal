import { Body, Controller, Post, Version } from '@nestjs/common';
import { RegisterCompanyDto } from './dtos/register-company.dto';
import { CompanyService } from './company.service';
import { Serialize } from 'src/decorators/interceptors';
import { CompanyDto } from './dtos/company.dto';

@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  //TODO: Add Captcha
  @Serialize(CompanyDto)
  @Version('1')
  @Post()
  async registerCompany(@Body() body: RegisterCompanyDto) {
    const registerData = await this.companyService.register(body);

    return { data: registerData, message: 'Successfully registered!' };
  }
}
