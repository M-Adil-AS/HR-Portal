import { InternalServerErrorException } from '@nestjs/common';
import { handleUserEmails } from './entityTypeHandlers/user.handler';
import { PendingNotification } from 'src/notification/interfaces/pending-notification.interface';
import { NotificationHandlerContext } from 'src/notification/interfaces/notification-handler-context.interface';

export const handleEmail = async (
  notification: PendingNotification,
  handlerContext: NotificationHandlerContext,
) => {
  const entityTypeHandlers = {
    user: handleUserEmails,
  };
  const entityTypeHandler = entityTypeHandlers[notification.entityType];

  if (entityTypeHandler) {
    await entityTypeHandler(notification, handlerContext);
  } else {
    throw new InternalServerErrorException(
      `No handler found for Entity Type: ${entityTypeHandler}`,
    );
  }
};

export const processEmailNotification = async (
  notification: PendingNotification,
  handlerContext: NotificationHandlerContext,
) => {
  const { emailService, notificationStatusRepository } = handlerContext;

  await emailService.sendEmail(
    notification.recipients.map((recipient) => recipient.recipientEmail),
    notification.action,
    notification.data,
  );

  await notificationStatusRepository.update(
    { notificationSchedule: { id: notification.scheduleId } },
    {
      isProcessed: true,
      processedAt: new Date(),
    },
  );
};
