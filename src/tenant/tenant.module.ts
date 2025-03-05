import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';

@Module({
  providers: [TenantService],
  imports: [TypeOrmModule.forFeature([Tenant], 'globalConnection')],
  exports: [TenantService],
})
export class TenantModule {}
