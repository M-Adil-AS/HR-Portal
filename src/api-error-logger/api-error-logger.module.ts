import { Global, Module } from '@nestjs/common';
import { ApiErrorLoggerService } from './api-error-logger.service';

@Global()
@Module({
  providers: [ApiErrorLoggerService],
  exports: [ApiErrorLoggerService],
})
export class ApiErrorLoggerModule {}
