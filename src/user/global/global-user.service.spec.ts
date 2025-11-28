import { Test, TestingModule } from '@nestjs/testing';
import { GlobalUserService } from './global-user.service';

describe('GlobalUserService', () => {
  let service: GlobalUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalUserService],
    }).compile();

    service = module.get<GlobalUserService>(GlobalUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
