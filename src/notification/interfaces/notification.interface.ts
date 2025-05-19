export interface Notification {
  id?: string;
  type: 'email' | 'web' | 'sms' | 'push' | 'whatsapp' | 'webhook';
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
