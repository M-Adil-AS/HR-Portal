import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

// ClassSerializerInterceptor applies DTO Expose/Exclude Rules but works only if route handler returns a new instance of DTO so there must be a constructor function in DTO class to instantiate the object.
// ClassSerializerInterceptor + @SeralizeOptions({type: DTO}) works even if a raw plain object is returned from route handler and hence does not need constructor function in DTO class.
// ClassSerializerInterceptor + @SeralizeOptions({type: DTO}) are two lines of code, that's why custom SerializeInterceptor is better approach (works even if a raw plain object is returned from route handler and hence does not need constructor function in DTO class).

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((response: any) => {
        if (response?.data) {
          response.data = plainToInstance(this.dto, response.data, {
            excludeExtraneousValues: true, // makes sure that there aren't any extra values passed without explicitly mentioned @Expose / @Exclude decorator.
          });
        }

        return response;
      }),
    );
  }
}
