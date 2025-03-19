import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { ErrorLog } from 'src/interfaces/error-log.interface';
import { QueryFailedError } from 'typeorm';

//TODO: After all the types, is it supposed to be HttpExceptionFilter or Global?

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR; // Default Error Status
    let message: string = exception?.['message'] || 'Internal Server Error'; // Default Error Message
    let data: Record<string, any> | null = null; // Default Error Data

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
      } else if (driverError?.code === 'ESOCKET') {
        // Connection Error
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database Connection Error';
        data = {
          error:
            driverError?.originalError?.info?.message || exception?.message, // DB Error specific details
          code: driverError?.code || null, // DB Error Code
          query: exception?.query || null, // Query Failed
        };
      }
    }
    // else if (exception instanceof AxiosError) {
    //   // The request was made and the server responded with a non-2xx status code
    //   if (exception?.response) {
    //     status = exception?.response?.status;
    //     message = `Request Failed with Status Code ${status}. ${exception?.response?.data['description'] || exception?.response?.data['message'] || ''}`;
    //     data = exception?.response?.data;
    //   }
    //   // The request was made but no response was received
    //   else if (exception?.request) {
    //     message = `Request Failed with Status Code ${status}. No Response received from the server!`;
    //     data = exception?.request;
    //   }
    //   // Something happened in setting up the request that triggered an Error
    //   else {
    //     message = `Request Failed with Status Code ${status}. Request not sent to server!`;
    //   }
    // }
    // else if (exception instanceof ZodError) {
    //   status = HttpStatus.BAD_REQUEST;
    //   message = 'Validation Error(s)';
    //   data = {
    //     type: 'zod', // Identifies this as a zod error for frontend containing issues
    //     issues: exception?.issues,
    //   };
    // }

    const errorLog: ErrorLog = {
      status,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
    };

    console.error(errorLog);

    //TODO: Save Logs in File / DB
    //TODO: Error must have custom logger
    //TODO: httpService (Axios Freeze)

    // Hide Database Details from the client
    const responseBody = {
      message: !(exception instanceof QueryFailedError)
        ? message
        : 'Something went wrong while processing your request',
      data: !(exception instanceof QueryFailedError) ? data : null,
    };

    httpAdapter.reply(response, responseBody, status);
  }
}
