import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { TenantModule } from 'src/tenant/tenant.module';
import { OtpModule } from 'src/otp/otp.module';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
  imports: [
    TypeOrmModule.forFeature([Company], 'globalConnection'),
    TenantModule,
    OtpModule,
  ],
})
export class CompanyModule {}
