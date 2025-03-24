import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './company.entity';
import { TenantModule } from 'src/tenant/tenant.module';
import { OtpModule } from 'src/otp/otp.module';
import { UserModule } from 'src/user/user.module';

/* 
  One option was to inject services like UserService, JobService in TenantModule 
  So CompanyService would use TenantService as an intermediary service to call other services like UserService
  But the problem would arise that there will be a lot of code in TenantService which breaks the Single Responsibility Principle
  TenantService should remain focused on managing Tenant Databases and Tenant Connections 

  It's clear that CompanyService should directly inject UserService
  Question remains that should CompanyModule directly import UserModule or import it through TenantModule
  
  If imported through TenantModule which doesn't use UserModule by itself, this pattern may lead to:
    - Wasted resources 
    - Unnecessary module loading
    - Increased computational overhead
    - Reduced code readability
  
  It's better to import dependencies directly so as to have:
    - Clear visibility of module dependencies
    - Straightforward dependency management
    - Improved performance
    - Simplified module structure

  Hence Better to import UserModule directly rather than importing it through TenantModule which doesn't use it
  
  Yes, this direct import approach doesn't create a perfect hierarchy (Company <- Tenant <- User), but it's more modular. 
  A perfect hierarchy would mean every module depends on only one other module above it, but in reality, some cross-module dependencies are natural.
  
  Practical Usability > Theoretical Purity:
    - The slight deviation from a perfect hierarchical structure is outweighed by:
      * Improved maintainability
      * Clearer service responsibilities
      * Better performance
      * Easier future extensions
      * More intuitive code organization

  If OtpModule is required and OtpService is to be used/injected in both UserModule & CompanyModule:
    - Import OtpModule in both modules
    - Modules are singleton by default in Nest
    - Same instance of OtpService will be used across all modules that import OtpModule
    - No performance or resource overhead in multiple imports

  Even if in the future, RoleModule is required and RoleService is to be used/injected in both UserModule & CompanyModule:
    - Import RoleModule in both modules
    - NestJS is designed to handle module imports efficiently
*/

@Module({
  controllers: [CompanyController],
  providers: [CompanyService],
  imports: [
    TypeOrmModule.forFeature([Company], 'globalConnection'),
    TenantModule,
    UserModule,
    OtpModule,
  ],
})
export class CompanyModule {}
