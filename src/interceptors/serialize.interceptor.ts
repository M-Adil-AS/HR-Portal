import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

interface ClassConstructor {
  new (...args: any[]): {};
}

// ClassSerializerInterceptor applies DTO Expose/Exclude Rules but works only if route handler returns a new instance of DTO so there must be a constructor function in DTO class to instantiate the object.
// ClassSerializerInterceptor + @SeralizeOptions({type: DTO}) works even if a raw plain object is returned from route handler and hence does not need constructor function in DTO class.
// ClassSerializerInterceptor + @SeralizeOptions({type: DTO}) are two lines of code, that's why custom SerializeInterceptor is better approach (works even if a raw plain object is returned from route handler and hence does not need constructor function in DTO class).

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data: any) => {
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true, // makes sure that there aren't any extra values passed without explicitly mentioned @Expose / @Exclude decorator.
        });
      }),
    );
  }
}
