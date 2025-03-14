import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR; // Default Error Status
    let message: string = 'Internal Server Error'; // Default Error Message
    let data: object | null = null; // Default Error Data

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse(); // Can be string or object

      if (typeof errorResponse === 'string') {
        message = errorResponse; // Set message as the error string
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        message = errorResponse?.['message'] || message; // By default, the Http Exception's Response Body contains message property
        data = errorResponse; // Store the full response object
      }
    } else if (exception instanceof QueryFailedError) {
      const driverError = exception?.driverError || {}; // Extract driver error

      if (driverError?.code === 'EREQUEST') {
        // General Query Error (e.g., syntax, constraint violations)
        status = HttpStatus.BAD_REQUEST; // 400 Bad Request
        message = 'Database Query Error';
        data = {
          error:
            driverError?.originalError?.info?.message || exception?.message, // DB Error specific details
          code: driverError?.code || null, // DB Error Code
          query: exception?.query || null, // Query Failed
        };
      }
    }

    const errorLog = {
      status,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
    };

    console.error(errorLog);

    //TODO: Save Logs in File / DB
    //TODO: Error must have custom logger
    //TODO: Other Error Type Implementations
    //TODO: httpService (Axios Freeze)

    // Hide Database Details from the client
    //TODO: What if we want to send unique constraint errors to client without DB Details
    const responseBody = {
      message: !(exception instanceof QueryFailedError)
        ? message
        : 'Something went wrong while processing your request',
      data: !(exception instanceof QueryFailedError) ? data : null,
    };

    httpAdapter.reply(response, responseBody, status);
  }
}
