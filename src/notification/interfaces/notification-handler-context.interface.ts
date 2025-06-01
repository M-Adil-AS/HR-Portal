import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { NotificationStatus } from '../entities/notification-status.entity';

export interface NotificationHandlerContext {
  emailService: EmailService;
  notificationStatusRepository: Repository<NotificationStatus>;
}
