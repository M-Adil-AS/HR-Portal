import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { ErrorLog } from './interfaces/error-log.interface';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { abortOnError: false });

    const configService = app.get(ConfigService);
    const port: number = Number(configService.get('PORT', 3000));

    await app.listen(port);
  } catch (error) {
    const errorLog: ErrorLog = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: error?.message,
      data: { name: error?.name, message: error?.message },
      timestamp: new Date().toISOString(),
      path: 'system/startup',
    };

    if (error?.name === 'ConnectionError') {
      errorLog['status'] = HttpStatus.SERVICE_UNAVAILABLE;

      errorLog['data'] = {
        ...errorLog['data'],
        code: error.code,
        originalErrorCode: error.originalError?.code,
        originalErrorMessage: error.originalError?.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'), // Only log first few lines of stack trace
      };
    }

    console.error(errorLog);
  }
}
bootstrap();
