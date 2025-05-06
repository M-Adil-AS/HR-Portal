import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { Notification } from './interfaces/notification.interface';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectDataSource('globalConnection')
    private globalConnection: DataSource,

    private readonly emailService: EmailService,
  ) {}

  async dispatch(notification: Notification): Promise<void> {
    const notificationId: string = await this.saveNotification(notification);

    await this.processNotifications(notificationId);

    // Deliver Notification
    if (notification['type'] === 'email') {
      await this.emailService.sendEmail(
        notification['sendTo'],
        notification['action'],
        notification['data'],
      );
    }
  }

  async processNotifications(notificationId: string | null) {
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

    const notifications = result;

    // const typeHandlers = {
    //   email: handleEmail,
    //   webhook: handleWebhook,
    // };

    // for (const notification of notifications) {
    //   try {
    //     context.log('Processing Notification: ' + JSON.stringify(notification));
    //     const type = notification.Type.trim(); // Trim whitespace from Type
    //     const typeHandler = typeHandlers[type];
    //     if (typeHandler && !notification['Actioned']) {
    //       await typeHandler(notification, emailData, context);
    //     } else {
    //       context.error(`No handler found for Type: ${type}`);
    //       throw new Error(`No handler found for Type: ${type}`);
    //     }
    //   } catch (err) {
    //     const errorMsg = err?.message || err?.response?.data?.message;
    //     const updateRequest = getPool().request();

    //     let updateQuery = `UPDATE NotificationSchedule SET IsErrored=${1}, ProcessedAt=GETDATE(), ErrorMsg=@errorMsg WHERE NotificationId=@notificationId`;

    //     updateRequest.input(`errorMsg`, sql.NVarChar, errorMsg || null);
    //     updateRequest.input(`notificationId`, sql.NVarChar, notification.ID);

    //     await updateRequest.query(updateQuery);

    //     logNotificationError(err, context);
    // }
  }
  // }

  // Type-specific handlers
  // const handleEmail = async (notification, emailData = {}, context) => {
  //   const entityTypeHandlers = {
  //     CustomerSubscription: handleCustomerSubscriptionEmails,
  //     Customer: handleCustomerEmails,
  //     WorkQueue: handleWorkQueueEmails,
  //     Order: handleOrderEmails,
  //   };

  //   const entityTypeHandler = entityTypeHandlers[notification.EntityType];
  //   if (entityTypeHandler) {
  //     await entityTypeHandler(
  //       notification.Action,
  //       notification,
  //       emailData,
  //       context
  //     );
  //   } else {
  //     context.error(
  //       `No handler found for EntityType: ${notification.EntityType}`
  //     );
  //     throw new Error(
  //       `No handler found for EntityType: ${notification.EntityType}`
  //     );
  //   }
  // };

  async saveNotification({
    type,
    link,
    sendTo,
    action,
    entityType,
    createdBy,
    data,
    schedule = null,
  }: Notification): Promise<string> {
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

    const { notificationId } = result[0];
    return notificationId;
  }
}
