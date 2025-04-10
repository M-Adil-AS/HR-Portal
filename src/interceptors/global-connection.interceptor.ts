import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class GlobalConnectionInterceptor implements NestInterceptor {
  constructor(
    @InjectDataSource('globalConnection')
    private globalConnection: DataSource,
  ) {}

  async intercept(
    context: ExecutionContext,
    handler: CallHandler,
  ): Promise<Observable<any>> {
    // Check and initialize the global connection if needed
    // the isInitialized check is mainly a safeguard against unexpected connection drops
    if (!this.globalConnection.isInitialized) {
      try {
        await this.globalConnection.initialize();
      } catch (error) {
        error.errorContext = 'Global Connection Initialization Failed';
        error.isSensitiveError = true;
        throw error;
      }
    }

    return handler.handle();
  }
}
