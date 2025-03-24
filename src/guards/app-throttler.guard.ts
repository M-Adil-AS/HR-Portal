import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;

    if (url.includes('/otp/generate')) {
      throw new ThrottlerException(
        'Please wait at least 60 seconds before requesting another OTP!',
      );
    } else if (url.includes('/otp/verify')) {
      throw new ThrottlerException(
        'Too many verification attempts. Please try again later!',
      );
    } else {
      throw new ThrottlerException(
        'Too many requests. Please try again later!',
      );
    }
  }
}
