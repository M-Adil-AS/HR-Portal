import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { Repository } from 'typeorm';
import { RegisterCompanyDto } from './dtos/register-company.dto';
import { TenantService } from 'src/tenant/tenant.service';
import { User } from 'src/user/user.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company, 'globalConnection')
    private companyRepository: Repository<Company>,

    private readonly tenantService: TenantService,
  ) {}

  async register({ companyName, adminEmail }: RegisterCompanyDto) {
    const dbName = `${companyName.replace(/\s+/g, '_')}_DB`;

    // Create Tenant Database
    const tenantLoginCredentials =
      await this.tenantService.createTenantDatabase(dbName);

    // Save Company-Tenant in Global DB
    const company = this.companyRepository.create({
      name: companyName,
      domain: adminEmail.split('@')[1],
      tenant: tenantLoginCredentials, // Automatically create a related Tenant because of cascade:true
    });
    await this.companyRepository.save(company);

    const tenantConnection = await this.tenantService.getTenantConnection(
      company.tenant.id,
    );

    // Create Tenant DB Tables
    await this.tenantService.createTenantTables(tenantConnection);

    // Insert Admin User into User Table of Tenant DB
    const userRepository = await this.tenantService.getTenantRepository(
      User,
      tenantConnection,
    );
    const user = userRepository.create({ email: adminEmail, role: 'Admin' });
    await userRepository.save(user);

    return company;
  }
}
