import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dtos/user.dto';
import { UserType } from './enums/user-type.enum';
import { GlobalUsers } from './global/global-user.entity';
import { TenantUsers } from './tenant/tenant-user.entity';

@Injectable()
export class UserService {
  constructor() {}

  mapToUserDto(globalUser: GlobalUsers, tenantUser?: TenantUsers): UserDto {
    let userDto = plainToInstance(UserDto, globalUser, {
      excludeExtraneousValues: true,
    });

    if (globalUser.userType === UserType.APP_USER && globalUser.appUser) {
      userDto.name = globalUser.appUser.name;
      userDto.createdAt = globalUser.appUser.createdAt;
    } else if (
      globalUser.userType === UserType.TENANT_USER &&
      globalUser.tenant &&
      tenantUser
    ) {
      userDto.name = tenantUser.name;
      userDto.createdAt = tenantUser.createdAt;
    }

    return userDto;
  }
}
