import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from 'src/user/user.entity';
import { generateSecurePassword } from 'src/utils/security';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantService {
  private connections = new Map<string, DataSource>();

  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,

    private configService: ConfigService,
  ) {}

  async createTenantDatabase(dbName: string) {
    // Using SysAdmin Login to create Tenant DBs instead of Global Login so that it doesn't become their owner and access/alter them
    const sysAdminConnection = new DataSource({
      type: 'mssql',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: Number(this.configService.get<string>('DATABASE_PORT', '1435')), // Default SQL Server port: Enable TCP/IP in SQL Server Config Manager, Set All IP to 1435, Restart SQL Express
      username: this.configService.get<string>('SYSADMIN_LOGIN'), // Enable SQL Server Authentication in SSMS, Create Login, Map to User, Assign Role / Permissions
      password: this.configService.get<string>('SYSADMIN_PASS'), // SysAdmin password
      database: this.configService.get<string>('SYSADMIN_DATABASE'), // Connect to master DB for administrative tasks
      name: `sysAdmin-connection`, // Connection Name
      synchronize: false, // Auto-Create tables if turned on. Can cause problems if tables are already created in DB. Must always be false in production.
      options: {
        encrypt: true, // To Encrypt traffic between application and database
        trustServerCertificate: true, // Bypass SSL verification (for local)
      },
      entities: [],
    });

    await sysAdminConnection.initialize();
    const tenantLoginPassword = generateSecurePassword(); // Generate dynamic password

    try {
      await sysAdminConnection.query(`CREATE DATABASE [${dbName}];`); // Needs to be executed separately.

      await sysAdminConnection.query(`
        CREATE LOGIN [Tenant_${dbName}_Login] WITH PASSWORD = '${tenantLoginPassword}'; -- Create a tenant-specific login

        USE [${dbName}]; -- Switch to the new tenant database
        
        CREATE USER [Tenant_${dbName}_User] FOR LOGIN [Tenant_${dbName}_Login]; -- Create a user inside the tenant database

        ALTER ROLE db_owner ADD MEMBER [Tenant_${dbName}_User]; -- Grant access to the tenant database
      `);
    } finally {
      await sysAdminConnection.destroy(); // Close the connection
    }

    return {
      dbName,
      login: `Tenant_${dbName}_Login`,
      password: tenantLoginPassword,
    };
  }

  async getTenantConnection(tenantId: string): Promise<DataSource> {
    //TODO: Implement True Connection Pooling

    if (this.connections.has(tenantId)) {
      const tenantConnection = this.connections.get(tenantId) as DataSource;

      // Check for Connection is Stale or not
      if (tenantConnection.isInitialized) return tenantConnection;
      else this.connections.delete(tenantId);
    }

    const tenantInfo: Partial<Tenant> =
      await this.getTenantDBCredentials(tenantId);

    const tenantConnection = new DataSource({
      type: 'mssql',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: Number(this.configService.get<string>('DATABASE_PORT', '1435')), // Default SQL Server port: Enable TCP/IP in SQL Server Config Manager, Set All IP to 1435, Restart SQL Express
      username: tenantInfo.login, // Enable SQL Server Authentication in SSMS, Create Login, Map to User, Assign Role / Permissions
      password: tenantInfo.password, // Your password
      database: tenantInfo.dbName, // Your database name
      name: `tenant-${tenantInfo.dbName}-connection`, // Dynamic Connection Name
      synchronize: false, // Auto-Create tables if turned on. Can cause problems if tables are already created in DB. Must always be false in production.
      options: {
        encrypt: true, // To Encrypt traffic between application and database
        trustServerCertificate: true, // Bypass SSL verification (for local)
      },
      entities: [User], // Register your entities
    });

    await tenantConnection.initialize();
    this.connections.set(tenantId, tenantConnection);

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
      select: ['id', 'dbName', 'login', 'password'], // Adjust field names based on your entity
    });

    if (!tenant) throw new Error('Tenant not Found!');
    //TODO: Throw Specific Error

    return tenant;
  }

  async getTenantRepository<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
    tenantConnection: DataSource,
  ): Promise<Repository<Entity>> {
    return tenantConnection.getRepository(entity);
  }
}
