import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from 'src/user/user.entity';
import { generateRandomString } from 'src/utils/crypto';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from 'src/crypto/crypto.service';

@Injectable()
export class TenantService {
  private connections = new Map<string, DataSource>();
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,

    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createTenantDatabase(dbName: string) {
    // Using Owner Login to create Tenant DBs instead of Global Login so that it doesn't become their owner and access/alter them
    const ownerConnection = await this.getOwnerConnection();

    const tenantLoginPassword = generateRandomString(); // Generate dynamic password

    const { encryptedPassword, salt, iv } = this.cryptoService.encryptPassword(
      tenantLoginPassword,
      dbName,
    );

    try {
      // Needs to be executed separately.
      await ownerConnection.query(`
        USE [master]; 

        CREATE DATABASE [${dbName}];
      `);

      // The statements in .query do not execute in a transaction
      await ownerConnection.query(`
        USE [master];

        CREATE LOGIN [Tenant_${dbName}_Login] WITH PASSWORD = '${tenantLoginPassword}'; -- Create a tenant-specific login

        USE [${dbName}]; -- Switch to the new tenant database
        
        CREATE USER [Tenant_${dbName}_User] FOR LOGIN [Tenant_${dbName}_Login]; -- Create a user inside the tenant database

        ALTER ROLE db_owner ADD MEMBER [Tenant_${dbName}_User]; -- Grant access to the tenant database
      `);
    } catch (error) {
      try {
        await ownerConnection.query(`
          USE [master];

          IF EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}')
          BEGIN
            ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; -- Close all existing connections before dropping
            DROP DATABASE [${dbName}];
          END

          IF EXISTS (SELECT name FROM sys.server_principals WHERE name = 'Tenant_${dbName}_Login')
          BEGIN
            DROP LOGIN [Tenant_${dbName}_Login];
          END
        `);
      } catch (cleanupError) {
        this.logger.error(
          'Create Tenant Database Cleanup Error: ',
          cleanupError,
        ); // Log the cleanup Error
      }

      throw error; // Throw the original Error
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
    if (this.connections.has(tenantId)) {
      const tenantConnection = this.connections.get(tenantId) as DataSource;

      // Check for Connection is Stale or not
      if (tenantConnection.isInitialized) return tenantConnection;
      else this.connections.delete(tenantId);
    }

    const tenantInfo: Pick<
      Tenant,
      'id' | 'dbName' | 'login' | 'encryptedPassword' | 'salt' | 'iv'
    > = await this.getTenantDBCredentials(tenantId);

    const decryptedPassword = this.cryptoService.decryptPassword(
      tenantInfo.encryptedPassword,
      tenantInfo.dbName,
      tenantInfo.salt,
      tenantInfo.iv,
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
    this.connections.set(tenantId, tenantConnection);

    return tenantConnection;
  }

  async createTenantTables(tenantConnection: DataSource) {
    //TODO: Implement proper Role Permissions System for Users

    await tenantConnection.query(`
      CREATE TABLE Users (
        id VARCHAR(100) PRIMARY KEY DEFAULT NEWID(),
        email VARCHAR(100) UNIQUE NOT NULL CHECK (LEN(email) BETWEEN 6 AND 100),
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

  async deleteTenantDatabase(dbName: string) {
    // Using Owner Login to delete Tenant DBs because it's the owner
    let ownerConnection;

    try {
      ownerConnection = await this.getOwnerConnection();

      // Drop Database (Ensure no active connections before dropping)
      await ownerConnection.query(`
        USE [master];

        ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [${dbName}];

        DROP LOGIN [Tenant_${dbName}_Login];
    `);
    } catch (cleanupError) {
      this.logger.error('Delete Tenant Database Cleanup Error: ', cleanupError); // Log the cleanup Error
    } finally {
      if (ownerConnection) await ownerConnection.destroy();
    }
  }

  private async getOwnerConnection(): Promise<DataSource> {
    // Create a new Owner Connection and destroy it in every request

    const ownerConnection = new DataSource({
      type: 'mssql',
      host: this.configService.get<string>('DATABASE_HOST', 'localhost'),
      port: Number(this.configService.get<string>('DATABASE_PORT', '1435')),
      username: this.configService.get<string>('OWNER_LOGIN'),
      password: this.configService.get<string>('OWNER_PASS'),
      database: this.configService.get<string>('OWNER_DATABASE'),
      name: `owner-connection`,
      synchronize: false,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
      entities: [],
    });

    await ownerConnection.initialize();
    return ownerConnection;
  }
}
