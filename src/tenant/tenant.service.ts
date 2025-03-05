import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from 'src/user/user.entity';

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
    //TODO: Create Separate DB Login (User) For Each Tenant with Appropriate Permissions / Custom Role
    //TODO: Create A Custom Role Having CREATE, UPDATE, DELETE TABLE Permissions for Global Database (Not SysAdmin)
    await this.globalDataSource.query(`CREATE DATABASE ${dbName}`);
  }

  async getTenantConnection(tenantId: string): Promise<DataSource> {
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
      username: 'SQL Server Login 2', // Enable SQL Server Authentication in SSMS, Add Login / User, Assign sysadmin Role
      password: 'ssmsLogin#123', // Your password
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
      select: ['id', 'dbName'], // Adjust field names based on your entity
    });

    if (!tenant) throw new Error('Tenant not Found!');
    //TODO: Throw Specific Error

    return tenant;
  }

  async getTenantRepository<Entity extends ObjectLiteral>(
    tenantId: string,
    entity: EntityTarget<Entity>,
  ): Promise<Repository<Entity>> {
    const connection = await this.getTenantConnection(tenantId);
    return connection.getRepository(entity);
  }
}
