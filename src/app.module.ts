import {
  BadRequestException,
  HttpStatus,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  APP_PIPE,
  HttpAdapterHost,
} from '@nestjs/core';
import { Company } from './company/company.entity';
import { Tenant } from './tenant/tenant.entity';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { GlobalConnectionInterceptor } from './interceptors/global-connection.interceptor';
import { AppInterceptor } from './interceptors/app.interceptor';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './guards/app-throttler.guard';

// Database Concepts:
// Server-level role/permission (e.g. sysadmin) can be applied only to Logins, because Users do not exist at the server level.
// Database-level role/permission (e.g. db_owner) can only be applied to Users, and a Login must first be mapped to a User in that database to be able to access it.

@Module({
  imports: [
    ConfigModule.forRoot({
      // NODE_ENV altered in package.json OR on deployment platform.
      // On deployed version, setting NODE_ENV on platform will override the NODE_ENV from build -> start:prod commands in package.json
      // If the file does not exist, ConfigModule will still load environment variables from process.env (which are set on the platform)
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      inject: [ConfigService], // Inject ConfigService
      name: 'globalConnection', // To differentiate from other DB Connections in App. Must use outside useFactory forRootAsync
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        return {
          type: 'mssql',
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: Number(configService.get<string>('DATABASE_PORT', '1435')), // SQL Server Port: Enable TCP/IP in SQL Server Config Manager, Set Listen on All IPs to No, Enable 127.0.0.1 on Port 1435, Restart SQL Express
          username: configService.get<string>('GLOBAL_LOGIN'), // Enable SQL Server Authentication in SSMS, Create Login, Map to User, Assign Role / Permissions
          password: configService.get<string>('GLOBAL_PASS'), // Your password
          database: configService.get<string>('GLOBAL_DATABASE'), // Your database name
          synchronize: false, // Auto-Create tables if turned on. Can cause problems if tables are already created in DB. Must always be false in production.
          options: {
            encrypt: true, // To Encrypt traffic between application and database, Set Force Encryption to True in SQL Server Configuration Manager Protocols for SQL Express
            trustServerCertificate: true, // Bypass SSL verification (for local)
          },
          entities: [Company, Tenant], // Register your entities
          autoLoadEntities: false, // Because there will be multiple DB connections in our App and not every Entity belongs to Global Database.
          extra: {
            max: 20, // Max no. of connections made internally in TypeORM. As requests come in, it creates more connections up to the max value. Each request uses a separate connection. If capacity is reached, additional requests wait in a queue until a connection becomes available.
            min: 5, // When initialized, it creates connections up to the min value. The minimum number of connections the pool will maintain even when idle.
            idleTimeoutMillis: 60000, // Idle connections are closed after idleTimeoutMillis until reaching min
          },
        };
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [createKeyv(configService.get<string>('REDIS_URL'))],
          ttl: 1000 * 60 * 5, // 5 minutes default ttl for all entries of every store
        };
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // Default TTL. 10 requests per minute per IP
          limit: 10,
        },
      ],
    }),

    CompanyModule,
    UserModule, //TODO: Maybe it should be in imports of CompanyModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // removes any properties that are not defined in your DTO
        transform: true, // request payloads are automatically converted to DTO instances
        stopAtFirstError: true, // one error returned per field
        exceptionFactory: (errors) => {
          return new BadRequestException({
            error: 'Bad Request',
            statusCode: HttpStatus.BAD_REQUEST,
            type: 'validator', // Identifies this as a validator error for frontend containing issues
            message: 'Validation Error(s)', // Single-line error for alert popup
            issues: errors.map((error) => ({
              field: error.property,
              message:
                Object.values(error?.constraints ?? {})[0] ||
                'Validation Error',
            })),
          });
        },
      }),
    },
    {
      provide: APP_FILTER,
      inject: [HttpAdapterHost], // Inject HttpAdapterHost. To make Exception Filter platform generic (Express/Fastify)
      useFactory: (httpAdapterHost: HttpAdapterHost) => {
        return new ApiExceptionFilter(httpAdapterHost);
      },
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalConnectionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AppInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
