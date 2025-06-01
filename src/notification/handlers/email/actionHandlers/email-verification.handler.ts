import { NotificationHandlerContext } from 'src/notification/interfaces/notification-handler-context.interface';
import { PendingNotification } from 'src/notification/interfaces/pending-notification.interface';
import { processEmailNotification } from '../index.handler';

export const handleEmailVerificationEmail = async (
  notification: PendingNotification,
  handlerContext: NotificationHandlerContext,
) => {
  await processEmailNotification(notification, handlerContext);
};
