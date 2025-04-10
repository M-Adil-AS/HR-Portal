import { Global, Module } from '@nestjs/common';
import { ApiErrorHandlerService } from './api-error-handler.service';

// BootErrorHandlerService is instantiated manually in main.ts and is not part of Nest DI system, hence not included in providers
@Global()
@Module({
  providers: [ApiErrorHandlerService],
  exports: [ApiErrorHandlerService],
})
export class ErrorHandlerModule {}
