export interface Notification {
  id: string;
  type: 'email' | 'web' | 'sms' | 'push';
  link: string | null;
  isRead: boolean | null;
  isActioned: boolean | null;
  sendTo: string[];
  action: string;
  entityType: string;
  createdBy: string;
  createdAt: Date;
  data: Record<string, any>;
}
