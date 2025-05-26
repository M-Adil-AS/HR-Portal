import { NotificationType } from '../types/notification.type';

export interface Notification {
  id?: string;
  type: NotificationType;
  link: string | null;
  isRead?: boolean;
  isActioned?: boolean;
  sendTo: string[];
  action: string;
  entityType: string;
  createdBy: string;
  createdAt?: Date;
  data: Record<string, any>;
  schedule?: string[] | null;
}
