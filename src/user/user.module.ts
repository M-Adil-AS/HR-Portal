import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TenantUserService } from './tenant/tenant-user.service';
import { CryptoModule } from 'src/crypto/crypto.module';
import { UserService } from './user.service';
import { GlobalUserService } from './global/global-user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalUsers } from './global/global-user.entity';
import { AppUsers } from './app/app-user.entity';

@Module({
  controllers: [UserController],
  providers: [TenantUserService, UserService, GlobalUserService],
  exports: [TenantUserService, UserService, GlobalUserService],
  imports: [
    CryptoModule,
    TypeOrmModule.forFeature([GlobalUsers, AppUsers], 'globalConnection'),
  ],
})
export class UserModule {}
