import { InternalServerErrorException } from '@nestjs/common';
import { handleEmailVerificationEmail } from '../actionHandlers/email-verification.handler';
import { PendingNotification } from 'src/notification/interfaces/pending-notification.interface';
import { NotificationHandlerContext } from 'src/notification/interfaces/notification-handler-context.interface';

export const handleUserEmails = async (
  notification: PendingNotification,
  handlerContext: NotificationHandlerContext,
) => {
  const actionHandlers = {
    emailVerification: handleEmailVerificationEmail,
  };
  const actionHandler = actionHandlers[notification.action];

  if (actionHandler) {
    await actionHandler(notification, handlerContext);
  } else {
    throw new InternalServerErrorException(
      `No handler found for Action: ${actionHandler}`,
    );
  }
};
