import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  async createAdminUserForTenant(
    tenantConnection: DataSource,
    adminEmail: string,
  ): Promise<User> {
    const userRepository = tenantConnection.getRepository(User);

    let user = userRepository.create({ email: adminEmail, role: 'Admin' });
    user = await userRepository.save(user);

    return user;
  }
}
