import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [
    CompanyModule,
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'localhost',
      port: 1435, // Default SQL Server port: Enable TCP/IP in SQL Server Config Manager, Set All IP to 1435, Restart SQL Express
      username: 'SQL Server Login 2', // Enable SQL Server Authentication in SSMS, Add Login / User, Assign sysadmin Role
      password: 'ssmsLogin#123', // Your password
      database: 'Global Database', // Your database name
      synchronize: true, // Auto-create tables (only in development)
      options: {
        encrypt: false, // Set to true if using Azure SQL
        trustServerCertificate: true, // Bypass SSL verification (for local)
      },
      entities: [User], // Register your entities
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
