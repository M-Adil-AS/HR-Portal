import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { CryptoModule } from 'src/crypto/crypto.module';

@Module({
  providers: [TenantService],
  imports: [
    TypeOrmModule.forFeature([Tenant], 'globalConnection'),
    CryptoModule,
  ],
  exports: [TenantService],
})
export class TenantModule {}
