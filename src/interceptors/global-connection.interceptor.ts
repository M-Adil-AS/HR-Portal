import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class GlobalConnectionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GlobalConnectionInterceptor.name);

  constructor(
    @InjectDataSource('globalConnection')
    private globalConnection: DataSource,
  ) {}

  //TODO: Error Handling of Interceptor Code
  //TODO: this.logger.error() & throw Errors with details?

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
        this.logger.error('Failed to initialize global connection', error);
        throw new ServiceUnavailableException('Connection Failed!');
      }
    }

    return handler.handle();
  }
}
