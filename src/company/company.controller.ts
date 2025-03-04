import { Body, Controller, Post } from '@nestjs/common';
import { RegisterCompanyDto } from './dtos/register-company.dto';

@Controller('company')
export class CompanyController {
  @Post()
  async registerCompany(@Body() body: RegisterCompanyDto) {
    // const user = await this.authService.signup(body.email, body.password);
    // return user;
  }
}
