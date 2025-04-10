import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ErrorLog } from 'src/interfaces/error-log.interface';

//TODO: Save Logs in File / DB
@Injectable()
export class BootErrorHandlerService {
  private readonly logger = new Logger(BootErrorHandlerService.name);

  logError(error) {
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

    this.logger.error(errorLog);
    this.writeLogToFile(errorLog);
  }

  writeLogToFile(errorLog: ErrorLog) {}
}
