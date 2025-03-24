import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  providers: [TenantService],
  imports: [TypeOrmModule.forFeature([Tenant], 'globalConnection'), UserModule],
  exports: [TenantService, UserModule],
})
export class TenantModule {}
