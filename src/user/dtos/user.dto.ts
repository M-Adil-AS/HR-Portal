import { Expose, Type } from 'class-transformer';
import { UserType } from '../enums/user-type.enum';
import { TenantDto } from 'src/tenant/dtos/tenant.dto';

export class UserDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  @Type(() => TenantDto)
  tenant: TenantDto | null;

  @Expose()
  userType: UserType;

  /* 
    These fields, although can be extracted out of globalUser.appUser relationship, but that is only for app_user
    Can't be done for tenantUser because of cross-DB
    Hence manual enrichment of these fields through service for both userTypes for consistency
  */
  @Expose()
  name: string;

  @Expose()
  createdAt: Date;
}
