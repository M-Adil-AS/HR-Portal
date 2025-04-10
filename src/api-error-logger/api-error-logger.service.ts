import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { ClsService } from 'nestjs-cls';
import { MyClsStore } from 'src/interfaces/cls.interface';
import { ErrorLog } from 'src/interfaces/error-log.interface';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class ApiErrorLoggerService {
  private readonly logger = new Logger(ApiErrorLoggerService.name);

  constructor(private readonly cls: ClsService<MyClsStore>) {}

  logError(
    exception: unknown,
    path: string = this.cls.get('req_url'),
    request_body: Record<string, any> | null = this.cls.get('req_body'),
  ) {
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
    } else if (exception instanceof AxiosError) {
      // The request was made and the server responded with a non-2xx status code
      if (exception?.response) {
        status = exception?.response?.status;
        message = `Request Failed with Status Code ${status}. ${exception?.response?.data['description'] || exception?.response?.data['message'] || ''}`;
        data = exception?.response?.data;
      }
      // The request was made but no response was received
      else if (exception?.request) {
        message = `Request Failed with Status Code ${status}. No Response received from the server!`;
        data = exception?.request;
      }
      // Something happened in setting up the request that triggered an Error
      else {
        message = `Request Failed with Status Code ${status}. Request not sent to server!`;
      }
    } else if (exception instanceof AggregateError) {
      if (exception?.['code'] === 'ECONNREFUSED') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Service Unavailable';
        data = {
          error: exception?.['errors'].map((error) => {
            return {
              address: error?.['address'],
              port: error?.['port'],
            };
          }),
          code: exception?.['code'],
        };
      }
    }
    // else if (exception instanceof ZodError) {
    //   status = HttpStatus.BAD_REQUEST;
    //   message = 'Validation Error(s)';
    //   data = {
    //     type: 'zod', // Identifies this as a zod error for frontend containing issues
    //     issues: exception?.issues,
    //   };
    // }

    // Add errorContext property to the data field if exists (i.e. for cleanupErrors etc)
    data =
      data || exception?.['errorContext']
        ? {
            ...(data || {}),
            errorContext: exception?.['errorContext'] || undefined,
          }
        : null;

    const errorLog: ErrorLog = {
      status,
      message,
      data,
      timestamp: new Date().toISOString(),
      path,
      request_body: request_body ? JSON.stringify(request_body) : null,
    };

    this.logger.error(errorLog);

    //TODO: Save Logs in File / DB (Do not save password, confirmPassword Fields)

    return { status, message, data };
  }
}
