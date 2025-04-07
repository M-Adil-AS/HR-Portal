import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    // Do something before route handler runs
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query } = request;

    return handler.handle().pipe(
      tap((response) => {
        // Audit Logs Handling
        const AUDIT_LOG_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

        if (AUDIT_LOG_METHODS.includes(method)) {
          this.logger.log({
            id: uuidv4(),
            tenantId: query?.tenantId || null,
            userEmail: query?.userEmail || null,
            method,
            url,
            performedAt: new Date(),
            module: 'Module ABC', // Can create an array mapping of Modules against Req Paths (Endpoints)
            task: 'Task XYZ', // Can create an array mapping of Tasks against Req Paths (Endpoints)
            request_body: body ? JSON.stringify(body) : null,
          });

          //TODO: Store Audit Logs in DB (Do not save password, confirmPassword Fields)
        }
      }),
      catchError((error) => {
        // catchError catches Errors thrown from tap() as well as from route handlers
        // Exception Filter will handle errors directly if catchError is not used
        return throwError(() => error);
      }),
    );
  }
}
