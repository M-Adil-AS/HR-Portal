import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TenantUserService } from './tenant/tenant-user.service';
import { CryptoModule } from 'src/crypto/crypto.module';

@Module({
  controllers: [UserController],
  providers: [TenantUserService],
  exports: [TenantUserService],
  imports: [CryptoModule],
})
export class UserModule {}
