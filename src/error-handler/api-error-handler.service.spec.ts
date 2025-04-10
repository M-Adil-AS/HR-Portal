import { Test, TestingModule } from '@nestjs/testing';
import { ApiErrorHandlerService } from './api-error-handler.service';

describe('ApiErrorHandlerService', () => {
  let service: ApiErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiErrorHandlerService],
    }).compile();

    service = module.get<ApiErrorHandlerService>(ApiErrorHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
