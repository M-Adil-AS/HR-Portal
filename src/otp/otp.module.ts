import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';

/*
  Analyzing options to handle various OTP flows (email/phone/push):
    Can have different OTP controllers (e.g. email-otp.controller, phone-otp.controller), or a single OTP controller
    Depends upon whether you prioritize strict separation of concerns or reduced boilerplate and centralized logic
    Also, if parameters like @Throttle() are different for each flow, you may consider having different otp controllers
    If you choose to have different OTP services (e.g. email-otp.service, phone-otp.service), you may also consider having different otp controllers
    Performance-wise, it doesn't matter much if one controller injects all three services or three controllers inject individual services
    Different controllers can provide more granular error handling and logging for specific OTP flows

    Can have one OTP controller and different route-handlers (e.g. otp/email/generate, otp/phone/generate) or single route-handler
    Depends upon whether you prioritize strict separation of concerns or reduced boilerplate and centralized logic
    Also, if parameters like @Throttle() are different for each flow, you may consider having different route handlers
    If you choose to have different OTP services (e.g. email-otp.service, phone-otp.service), you should have different route handlers
    Little complex DTO Validation for a single route handler handling various flow types
    Improved type safety and more explicit API documentation with different route handlers
    Single route-handler reduces boilerplate, but requires conditional logic inside the method

    Can have one different OTP services (e.g. email-otp.service, phone-otp.service), or a single OTP service with different methods, or a single OTP service with same method
    Depends upon whether you prioritize strict separation of concerns or reduced boilerplate and centralized logic
    If implementation of various flows is different, you should have different OTP services or a single OTP service with different methods
    If implementation of various flows is very similar, you should have single OTP service with same method
    Different services or different methods provide better isolation for complex business logic
    Easier to mock and test individual OTP generation flows with separate services or separate methods
    Single service with same method can reduce code duplication and simplify dependency management
*/

@Module({
  providers: [OtpService],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
