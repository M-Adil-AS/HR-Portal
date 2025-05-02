import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { Notification } from './interfaces/notification.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async dispatch(notification: Notification): Promise<void> {
    // Deliver Notification
    if (notification['type'] === 'email') {
      const templateId = this.configService.get<string>(
        `SENDGRID_TEMPLATE_${notification['action'].replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`,
      ) as string;

      if (templateId) {
        await this.emailService.sendEmail(
          notification['sendTo'],
          templateId,
          notification['data'],
        );
      } else {
        //TODO: Log or Throw Appropriate Error
      }
    }
  }
}
