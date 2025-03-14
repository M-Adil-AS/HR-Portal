import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from 'src/user/user.entity';
import {
  decryptPassword,
  encryptPassword,
  generateRandomPassword,
} from 'src/utils/security';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,

    private configService: ConfigService,
  ) {}

  async createTenantDatabase(dbName: string) {
    // Using Owner Login to create Tenant DBs instead of Global Login so that it doesn't become their owner and access/alter them
    const ownerConnection = new DataSource({
      type: 'mssql',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: Number(this.configService.get<string>('DATABASE_PORT', '1435')), // SQL Server Port: Enable TCP/IP in SQL Server Config Manager, Set Listen on All IPs to No, Enable 127.0.0.1 on Port 1435, Restart SQL Express
      username: this.configService.get<string>('OWNER_LOGIN'), // Enable SQL Server Authentication in SSMS, Create Login, Map to User, Assign Role / Permissions
      password: this.configService.get<string>('OWNER_PASS'), // Owner Login password
      database: this.configService.get<string>('OWNER_DATABASE'), // Connect to master DB for administrative tasks
      name: `owner-connection`, // Connection Name
      synchronize: false, // Auto-Create tables if turned on. Can cause problems if tables are already created in DB. Must always be false in production.
      options: {
        encrypt: true, // To Encrypt traffic between application and database, Set Force Encryption to True in SQL Server Configuration Manager Protocols for SQL Express
        trustServerCertificate: true, // Bypass SSL verification (for local)
      },
      entities: [],
    });

    await ownerConnection.initialize();
    const tenantLoginPassword = generateRandomPassword(); // Generate dynamic password

    const { encryptedPassword, salt, iv } = encryptPassword(
      tenantLoginPassword,
      dbName,
      this.configService.get<string>('ENCRYPTION_SECRET') as string,
    );

    try {
      await ownerConnection.query(`CREATE DATABASE [${dbName}];`); // Needs to be executed separately.

      await ownerConnection.query(`
        CREATE LOGIN [Tenant_${dbName}_Login] WITH PASSWORD = '${tenantLoginPassword}'; -- Create a tenant-specific login

        USE [${dbName}]; -- Switch to the new tenant database
        
        CREATE USER [Tenant_${dbName}_User] FOR LOGIN [Tenant_${dbName}_Login]; -- Create a user inside the tenant database

        ALTER ROLE db_owner ADD MEMBER [Tenant_${dbName}_User]; -- Grant access to the tenant database
      `);
    } finally {
      await ownerConnection.destroy(); // Close the connection
    }

    return {
      dbName,
      login: `Tenant_${dbName}_Login`,
      encryptedPassword,
      salt,
      iv,
    };
  }

  async getTenantConnection(tenantId: string): Promise<DataSource> {
    const tenantInfo: Pick<
      Tenant,
      'id' | 'dbName' | 'login' | 'encryptedPassword' | 'salt' | 'iv'
    > = await this.getTenantDBCredentials(tenantId);

    const decryptedPassword = decryptPassword(
      tenantInfo.encryptedPassword,
      tenantInfo.dbName,
      tenantInfo.salt,
      tenantInfo.iv,
      this.configService.get<string>('ENCRYPTION_SECRET') as string,
    );

    const tenantConnection = new DataSource({
      type: 'mssql',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: Number(this.configService.get<string>('DATABASE_PORT', '1435')), // SQL Server Port: Enable TCP/IP in SQL Server Config Manager, Set Listen on All IPs to No, Enable 127.0.0.1 on Port 1435, Restart SQL Express
      username: tenantInfo.login, // Enable SQL Server Authentication in SSMS, Create Login, Map to User, Assign Role / Permissions
      password: decryptedPassword, // Your password
      database: tenantInfo.dbName, // Your database name
      name: `tenant-${tenantInfo.dbName}-connection`, // Dynamic Connection Name
      synchronize: false, // Auto-Create tables if turned on. Can cause problems if tables are already created in DB. Must always be false in production.
      options: {
        encrypt: true, // To Encrypt traffic between application and database, Set Force Encryption to True in SQL Server Configuration Manager Protocols for SQL Express
        trustServerCertificate: true, // Bypass SSL verification (for local)
      },
      entities: [User], // Register your entities
      extra: {
        max: 10, // Max connections the pool can create. If all are in use, new queries must wait until a connection is free
        min: 2, // Pool always keeps at least Min connections open, even when idle
        idleTimeoutMillis: 30000, // Close idle connections after 30s
      },
    });

    await tenantConnection.initialize();

    return tenantConnection;
  }

  async createTenantTables(tenantConnection: DataSource) {
    await tenantConnection.query(`
      CREATE TABLE Users (
        id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) UNIQUE NOT NULL,
        role NVARCHAR(50) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE()
      );
    `);
  }

  private async getTenantDBCredentials(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      select: ['id', 'dbName', 'login', 'encryptedPassword', 'salt', 'iv'], // Adjust field names based on your entity
    });

    if (!tenant) throw new NotFoundException('Tenant not Found!');

    return tenant;
  }

  async getTenantRepository<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    tenantConnection: DataSource,
  ): Promise<Repository<Entity>> {
    return tenantConnection.getRepository(entity);
  }
}
