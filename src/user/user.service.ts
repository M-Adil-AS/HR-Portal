import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  async createAdminUserForTenant(
    tenantConnection: DataSource,
    email: string,
  ): Promise<User> {
    const userRepository = tenantConnection.getRepository(User);

    let user = userRepository.create({ email });
    user = await userRepository.save(user);

    return user;
  }
}
