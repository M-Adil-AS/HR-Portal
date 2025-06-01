import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { NotificationService } from './notification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationStatus } from './entities/notification-status.entity';

@Module({
  providers: [EmailService, NotificationService],
  exports: [NotificationService, EmailService],
  imports: [TypeOrmModule.forFeature([NotificationStatus], 'globalConnection')],
})
export class NotificationModule {}
