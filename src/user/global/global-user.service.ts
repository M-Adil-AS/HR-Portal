import { BadRequestException, Injectable } from '@nestjs/common';
import { GlobalUsers } from './global-user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserType } from '../enums/user-type.enum';

@Injectable()
export class GlobalUserService {
  constructor(
    @InjectRepository(GlobalUsers, 'globalConnection')
    private globalUserRepository: Repository<GlobalUsers>,
  ) {}

  async validateAccountManager(accountManagerId: string): Promise<GlobalUsers> {
    const accountManager = await this.globalUserRepository
      .createQueryBuilder('user')
      .innerJoin('user.appUser', 'appUser')
      .where('user.id = :id', { id: accountManagerId })
      .andWhere('user.userType = :userType', { userType: UserType.APP_USER })
      .andWhere('user.tenant IS NULL')
      .andWhere('appUser.isDeleted = false')
      .getOne();

    if (!accountManager) {
      throw new BadRequestException('Account Manager does not exist!');
    }

    return accountManager;
  }
}
