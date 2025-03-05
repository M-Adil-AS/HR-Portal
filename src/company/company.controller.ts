import { Body, Controller, Post } from '@nestjs/common';
import { RegisterCompanyDto } from './dtos/register-company.dto';
import { CompanyService } from './company.service';

//TODO: Apply Versioning
@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Post()
  async registerCompany(@Body() body: RegisterCompanyDto) {
    const company = await this.companyService.register(body);

    return { message: 'Company Registered Successfully!', data: company };
  }
}
