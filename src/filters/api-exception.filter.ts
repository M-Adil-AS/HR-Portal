import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { ApiErrorLoggerService } from 'src/api-error-logger/api-error-logger.service';
import { QueryFailedError } from 'typeorm';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly apiErrorLogger: ApiErrorLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, data } = this.apiErrorLogger.logError(
      exception,
      httpAdapter.getRequestUrl(request),
      request?.body ? request?.body : null,
    );

    // Hide Sensitive Details (Database / Network) from the client
    const sensitiveErrorTypes = [QueryFailedError, AggregateError];
    const isSensitiveError =
      sensitiveErrorTypes.some((errorType) => exception instanceof errorType) ||
      exception?.['isSensitiveError'];

    const responseBody = {
      message: !isSensitiveError
        ? message
        : 'Something went wrong while processing your request',
      data: !isSensitiveError ? data : null,
    };

    httpAdapter.reply(response, responseBody, status);
  }
}
