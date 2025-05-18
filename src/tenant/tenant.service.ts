import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { TenantUsers } from 'src/user/tenant/tenant-user.entity';
import { generateRandomString } from 'src/utils/crypto';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from 'src/crypto/crypto.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TenantCredentials } from './interfaces/tenantCredentials.interface';
import { ApiErrorHandlerService } from 'src/error-handler/api-error-handler.service';

@Injectable()
export class TenantService {
  //TODO: Research if sensitive data i.e. tenant-credentials should be stored in Redis or not?
  //TODO: Implement Redis Security?
  private connections = new Map<string, DataSource>();

  constructor(
    @InjectRepository(Tenant, 'globalConnection')
    private tenantRepository: Repository<Tenant>,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
    private readonly apiErrorHandlerService: ApiErrorHandlerService,
  ) {}

  async createTenantDatabase(dbName: string) {
    // Using Owner Login to create Tenant DBs instead of Global Login so that it doesn't become their owner and access/alter them
    const ownerConnection = await this.getOwnerConnection();

    const tenantLoginPassword = generateRandomString(); // Generate dynamic password

    const { encryptedPassword, salt, iv } =
      this.cryptoService.encryptPasswordWithDerivedKey(
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
        cleanupError.errorContext = 'Create Tenant Database Cleanup Error';
        this.apiErrorHandlerService.logError(cleanupError);
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
    // ✅ Check in-memory cache first (fastest)
    if (this.connections.has(tenantId)) {
      const tenantConnection = this.connections.get(tenantId) as DataSource;

      // Check for Connection is Stale or not
      if (tenantConnection.isInitialized) return tenantConnection;
      else this.connections.delete(tenantId);
    }

    // ✅ Check Redis (faster than DB, persists data across multiple servers compared to local memory storage)
    let tenantInfo: TenantCredentials;

    let redisCachedData: string | null = await this.cacheManager.get(
      `tenant-credentials:${tenantId}`,
    );

    if (!redisCachedData) {
      // ✅ If not found in Redis, fetch from DB (fallback)
      tenantInfo = await this.getTenantDBCredentials(tenantId);

      // Store in Redis for future use (with TTL / expiry)
      await this.cacheManager.set(
        `tenant-credentials:${tenantId}`,
        JSON.stringify(tenantInfo),
        1000 * 60 * 60 * 24, // 1 day expiry
      );
    } else {
      // Parse Redis JSON data
      tenantInfo = JSON.parse(redisCachedData) as TenantCredentials;
    }

    const decryptedPassword = this.cryptoService.decryptPasswordWithDerivedKey(
      tenantInfo.encryptedPassword,
      tenantInfo.salt,
      tenantInfo.iv,
      tenantInfo.dbName,
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
      entities: [TenantUsers], // Register your entities
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
        name VARCHAR(50) NOT NULL CHECK (LEN(name) BETWEEN 3 AND 50),
        email VARCHAR(100) UNIQUE NOT NULL CHECK (LEN(email) BETWEEN 6 AND 100),
        password VARCHAR(200) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        isDeleted BIT DEFAULT 0,
        -- phoneNumber VARCHAR(20) UNIQUE NOT NULL, -- Must include if app supports sms / whatsapp notifications
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
      cleanupError.errorContext = 'Delete Tenant Database Cleanup Error';
      this.apiErrorHandlerService.logError(cleanupError);
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
