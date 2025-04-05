import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { CryptoService } from 'src/crypto/crypto.service';

@Injectable()
export class UserService {
  constructor(private readonly cryptoService: CryptoService) {}

  async createAdminUserForTenant(
    tenantConnection: DataSource,
    email: string,
    name: string,
    password: string,
  ): Promise<User> {
    const userRepository = tenantConnection.getRepository(User);
    const hashedPassword = await this.cryptoService.hashPassword(password);

    let user = userRepository.create({ email, name, password: hashedPassword });
    user = await userRepository.save(user);

    return user;
  }
}
