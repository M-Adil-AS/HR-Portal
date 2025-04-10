import { Test, TestingModule } from '@nestjs/testing';
import { BootErrorHandlerService } from './boot-error-handler.service';

describe('BootErrorHandlerService', () => {
  let service: BootErrorHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BootErrorHandlerService],
    }).compile();

    service = module.get<BootErrorHandlerService>(BootErrorHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
