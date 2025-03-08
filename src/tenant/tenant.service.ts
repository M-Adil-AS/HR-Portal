import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from 'src/user/user.entity';
import { generateSecurePassword } from 'src/utils/security';

@Injectable()
export class TenantService {
  private connections = new Map<string, DataSource>();

  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,

    @InjectDataSource('globalConnection')
    private readonly globalDataSource: DataSource,
  ) {}

  async createTenantDatabase(dbName: string) {
    await this.globalDataSource.query(`CREATE DATABASE [${dbName}];`); // Needs to be executed separately

    const tenantLoginPassword = generateSecurePassword(); // Generate dynamic password

    await this.globalDataSource.query(`
      CREATE LOGIN [Tenant ${dbName} Login] WITH PASSWORD = '${tenantLoginPassword}'; -- Create a tenant-specific login
    
      USE [${dbName}]; -- Switch to the new tenant database

      CREATE USER [Tenant ${dbName} User] FOR LOGIN [Tenant ${dbName} Login]; -- Create a user inside the tenant database
   
      ALTER ROLE db_owner ADD MEMBER [Tenant ${dbName} User];  -- Grant access to the tenant database

      USE [Global Database]; -- Switch back to global database
    `);

    return {
      dbName,
      login: `Tenant ${dbName} Login`,
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
      host: 'localhost',
      port: 1435, // Default SQL Server port: Enable TCP/IP in SQL Server Config Manager, Set All IP to 1435, Restart SQL Express
      username: tenantInfo.login, // Enable SQL Server Authentication in SSMS, Create Login, Map to User, Assign Role / Permissions
      password: tenantInfo.password, // Your password
      database: tenantInfo.dbName, // Your database name
      name: `tenant-${tenantInfo.dbName}-connection`, // Dynamic Connection Name
      synchronize: false, // Auto-Create tables if turned on. Can cause problems if tables are already created in DB. Must always be false in production.
      options: {
        encrypt: false, // Set to true if using Azure SQL
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
