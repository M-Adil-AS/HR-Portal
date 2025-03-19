import { Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    // Framework-level defaults
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
      baseURL: 'https://www.google.com/',
    }),
  ],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
