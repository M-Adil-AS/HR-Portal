import { Expose, Type } from 'class-transformer';
import { TenantDto } from 'src/tenant/dtos/tenant.dto';
import { UserDto } from 'src/user/dtos/user.dto';

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

  @Expose()
  @Type(() => UserDto)
  user: UserDto;
}
