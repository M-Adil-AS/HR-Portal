import { Test, TestingModule } from '@nestjs/testing';
import { ApiErrorLoggerService } from './api-error-logger.service';

describe('ApiErrorLoggerService', () => {
  let service: ApiErrorLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiErrorLoggerService],
    }).compile();

    service = module.get<ApiErrorLoggerService>(ApiErrorLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
