import { Expose, Type } from 'class-transformer';
import { TenantDto } from 'src/tenant/dtos/tenant.dto';

export class CompanyDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  domain: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => TenantDto)
  tenant: TenantDto;
}
