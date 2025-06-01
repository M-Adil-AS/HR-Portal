import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { Notification } from './interfaces/notification.interface';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiErrorHandlerService } from 'src/error-handler/api-error-handler.service';
import { NotificationStatus } from './entities/notification-status.entity';
import { PendingNotification } from './interfaces/pending-notification.interface';
import { handleEmail } from './handlers/email/index.handler';

//TODO: Change DATETIME to UTC: DATETIMEOFFSET
//TODO: WebSocket web Notifications

@Injectable()
export class NotificationService {
  constructor(
    @InjectDataSource('globalConnection')
    private globalConnection: DataSource,

    @InjectRepository(NotificationStatus, 'globalConnection')
    private notificationStatusRepository: Repository<NotificationStatus>,

    private readonly emailService: EmailService,
    private readonly apiErrorHandlerService: ApiErrorHandlerService,
  ) {}

  static readonly groupedTypes: string[] = ['email'];

  async dispatch(notification: Notification): Promise<void> {
    const notificationId: number = await this.saveNotification(notification);

    await this.processNotifications(notificationId);
  }

  async processNotifications(notificationId: number | null) {
    let result;

    if (notificationId === null) {
      result = await this.globalConnection.query(
        `EXEC [dbo].[GetPendingNotifications];`,
      );
    } else {
      result = await this.globalConnection.query(
        `EXEC [dbo].[GetPendingNotifications] 
          @notificationId = @0`,
        [notificationId],
      );
    }

    const notifications: PendingNotification[] = result.map(
      (notification: any) => {
        return {
          ...notification,
          data: JSON.parse(notification.data),
          recipients: JSON.parse(notification.recipients),
        };
      },
    );

    const typeHandlers = {
      email: handleEmail,
      // webhook: handleWebhook,
    };

    for (const notification of notifications) {
      try {
        const type = notification.type.trim(); // Trim whitespace from Type
        const typeHandler = typeHandlers[type];

        if (typeHandler) {
          await typeHandler(notification, {
            emailService: this.emailService,
            notificationStatusRepository: this.notificationStatusRepository,
          });
        } else {
          throw new InternalServerErrorException(
            `No handler found for Notification Type: ${type}`,
          );
        }
      } catch (err) {
        const { message } = this.apiErrorHandlerService.logError(err);

        const whereCondition = NotificationService.groupedTypes.includes(
          notification.type,
        )
          ? { notificationSchedule: { id: notification.scheduleId } }
          : {
              id: notification?.recipients?.[0]?.notificationStatus
                ?.notificationStatusId,
            };

        await this.notificationStatusRepository.update(whereCondition, {
          isErrored: true,
          erroredAt: new Date(),
          errorMsg: message || null,
        });

        // If Notification is to be processed immediately (API request: notificationId !== NULL), throw error
        if (notificationId !== null) throw err;
      }
    }
  }

  async saveNotification({
    type,
    link,
    sendTo,
    action,
    entityType,
    createdBy,
    data,
    schedule = null,
  }: Notification): Promise<number> {
    const result = await this.globalConnection.query(
      `EXEC [dbo].[SaveNotification] 
        @type = @0, 
        @entityType = @1, 
        @action = @2, 
        @createdBy = @3, 
        @link = @4, 
        @sendTo = @5, 
        @data = @6, 
        @schedule = @7`,
      [
        type,
        entityType,
        action,
        createdBy,
        link,
        sendTo.join(','),
        JSON.stringify(data),
        schedule?.join(','),
      ],
    );

    const { notificationId }: { notificationId: number } = result[0];
    return notificationId;
  }
}
