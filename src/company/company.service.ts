import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { Repository } from 'typeorm';
import { RegisterCompanyDto } from './dtos/register-company.dto';
import { TenantService } from 'src/tenant/tenant.service';
import { User } from 'src/user/user.entity';
import { TenantCredentials } from 'src/tenant/interfaces/tenantCredentials.interface';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company, 'globalConnection')
    private companyRepository: Repository<Company>,

    private readonly tenantService: TenantService,
  ) {}

  async register({ companyName, adminEmail }: RegisterCompanyDto) {
    const domain = adminEmail.split('@')[1];

    const companyAlreadyExists = await this.companyRepository.findOne({
      where: [{ name: companyName }, { domain }],
      select: ['id', 'name', 'domain'], // Adjust field names based on your entity
    });

    if (companyAlreadyExists?.['name'] === companyName) {
      throw new BadRequestException('This Company is already registered!');
    } else if (companyAlreadyExists?.['domain'] === domain) {
      throw new BadRequestException(
        'Company with this domain is already registered!',
      );
    }

    const dbName = `${companyName.replace(/\s+/g, '_')}_DB`;

    let tenantLoginCredentials: TenantCredentials | null = null;
    let company: Company | null = null;

    try {
      // Create Tenant Database
      tenantLoginCredentials =
        await this.tenantService.createTenantDatabase(dbName);

      // Save Company-Tenant in Global DB
      company = this.companyRepository.create({
        name: companyName,
        domain,
        tenant: tenantLoginCredentials, // Automatically create a related Tenant Entity instance because of cascade:true
      });

      company = await this.companyRepository.save(company);

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
    } catch (error) {
      if (tenantLoginCredentials) {
        await this.tenantService.deleteTenantDatabase(
          tenantLoginCredentials?.dbName,
        );
      }

      if (company?.id) {
        await this.companyRepository.delete(company.id);
      }

      throw error;
    }
  }
}
