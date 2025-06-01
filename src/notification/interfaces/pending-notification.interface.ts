import { UserType } from 'src/user/enums/user-type.enum';
import { NotificationType } from '../types/notification.type';

export interface PendingNotification {
  notificationId: number;
  type: NotificationType;
  link: string | null;
  action: string;
  entityType: string;
  data: Record<string, any>;

  scheduleId: number;
  actionDateTime: Date;

  recipients: {
    recipientEmail: string;
    recipientTenantId: string | null;
    recipientUserType: UserType;
    notificationRecipientId: string;

    notificationStatus?: {
      notificationStatusId: string;
      isRead: boolean;
    };
  }[];
}
