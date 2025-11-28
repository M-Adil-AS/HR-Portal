import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/company/company.entity';
import { OtpService } from 'src/otp/otp.service';
import { TenantService } from 'src/tenant/tenant.service';
import { TenantUserService } from 'src/user/tenant/tenant-user.service';
import { Like, Not, Repository } from 'typeorm';
import { SubmitOnboardingDto } from './dtos/submit-onboarding.dto';
import { WorkQueue } from './workqueue.entity';
import { CryptoService } from 'src/crypto/crypto.service';
import { plainToInstance } from 'class-transformer';
import { UserDto } from 'src/user/dtos/user.dto';
import { UserService } from 'src/user/user.service';
import { UpdateOnboardingDto } from './dtos/update-onboarding.dto';
import { GlobalUsers } from 'src/user/global/global-user.entity';
import { UserType } from 'src/user/enums/user-type.enum';
import { GlobalUserService } from 'src/user/global/global-user.service';

@Injectable()
export class WorkqueueService {
  constructor(
    @InjectRepository(Company, 'globalConnection')
    private companyRepository: Repository<Company>,

    @InjectRepository(WorkQueue, 'globalConnection')
    private workqueueRepository: Repository<WorkQueue>,

    private readonly globalUserService: GlobalUserService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,
    private readonly cryptoService: CryptoService,
  ) {}

  async submitOnboardingRequest({
    companyName,
    email,
    userName,
    otp,
    password,
  }: SubmitOnboardingDto) {
    await this.otpService.verifyOtp(email, otp); // ✅ Verify OTP before any DB operations

    const domain = email.split('@')[1];

    const [onboardingAlreadyExists, companyAlreadyExists] = await Promise.all([
      this.workqueueRepository.findOne({
        where: [
          { companyName, status: Not('rejected') },
          { email: Like(`%@${domain}`) },
        ],
        select: ['id', 'companyName', 'email'], // Adjust field names based on your entity
      }),
      this.companyRepository.findOne({
        where: [{ name: companyName }, { domain }],
        select: ['id', 'name', 'domain'], // Adjust field names based on your entity
      }),
    ]);

    if (onboardingAlreadyExists?.companyName === companyName) {
      throw new BadRequestException(
        'Onboarding Request with this company name is already submitted!',
      );
    } else if (onboardingAlreadyExists?.email.endsWith(`@${domain}`)) {
      throw new BadRequestException(
        'Onboarding Request with this company domain is already submitted!',
      );
    }

    if (companyAlreadyExists?.name === companyName) {
      throw new BadRequestException('This Company is already registered!');
    } else if (companyAlreadyExists?.domain === domain) {
      throw new BadRequestException(
        'Company with this domain is already registered!',
      );
    }

    const hashedPassword = await this.cryptoService.hashPassword(password);

    let onboardingRequest = this.workqueueRepository.create({
      email,
      userName,
      companyName,
      password: hashedPassword,
    });

    onboardingRequest = await this.workqueueRepository.save(onboardingRequest);

    return { ...onboardingRequest, accountManager: null };
  }

  async updateOnboardingRequest(
    workqueueId: string,
    { accountManagerId }: UpdateOnboardingDto,
  ) {
    const workqueue = await this.workqueueRepository.findOne({
      where: { id: workqueueId, status: 'pending' },
    });

    if (!workqueue) {
      throw new BadRequestException(
        'WorkQueue request does not exist or is already processed.',
      );
    }

    // Use Query Builder for nullable relations
    //TODO: Verify that this global user has account manager role/permissions
    const accountManager =
      await this.globalUserService.validateAccountManager(accountManagerId);

    // Update with new account manager
    workqueue.accountManager = accountManager;
    await this.workqueueRepository.save(workqueue);

    return {
      ...workqueue,
      accountManager: this.userService.mapToUserDto(accountManager),
    };
  }
}
