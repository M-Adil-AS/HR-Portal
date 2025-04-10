import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';
import { BootErrorHandlerService } from './error-handler/boot-error-handler.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { abortOnError: false });

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
    });

    const configService = app.get(ConfigService);
    const port: number = Number(configService.get('PORT', 3000));

    await app.listen(port);
  } catch (error) {
    const bootErrorHandlerService: BootErrorHandlerService =
      new BootErrorHandlerService();
    bootErrorHandlerService.logError(error);
  }
}
bootstrap();
