import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { TenantModule } from './tenant/tenant.module';
import { Company } from './company/company.entity';
import { Tenant } from './tenant/tenant.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'localhost',
      port: 1435, // Default SQL Server port: Enable TCP/IP in SQL Server Config Manager, Set All IP to 1435, Restart SQL Express
      username: 'SQL Server Login 2', // Enable SQL Server Authentication in SSMS, Add Login / User, Assign sysadmin Role
      password: 'ssmsLogin#123', // Your password
      database: 'Global Database', // Your database name
      name: 'globalConnection', // To differentiate from other DB Connections in App
      synchronize: false, // Auto-Create tables if turned on. Can cause problems if tables are already created in DB. Must always be false in production.
      options: {
        encrypt: false, // Set to true if using Azure SQL
        trustServerCertificate: true, // Bypass SSL verification (for local)
      },
      entities: [Company, Tenant], // Register your entities
      autoLoadEntities: false, // Because there will be multiple DB connections in our App and not every Entity belongs to Global Database.
    }),
    CompanyModule,
    TenantModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // removes any properties that are not defined in your DTO
        transform: true, // request payloads are automatically converted to DTO instances
      }),
    },
  ],
})
export class AppModule {}
