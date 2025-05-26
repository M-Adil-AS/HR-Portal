import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { NotificationRecipient } from './notification-recipient.entity';
import { NotificationSchedule } from './notification-schedule.entity';

@Entity({ name: 'NotificationStatus' })
export class NotificationStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bit', default: false })
  isRead: boolean;

  @Column({ type: 'bit', default: false })
  isProcessed: boolean;

  @Column({ type: 'bit', default: false })
  isErrored: boolean;

  @Column({ type: 'datetime', nullable: true, default: null })
  processedAt: Date | null;

  @Column({ type: 'datetime', nullable: true, default: null })
  erroredAt: Date | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true, default: null })
  errorMsg: string | null;

  @ManyToOne(
    () => NotificationRecipient,
    (notificationRecipient) => notificationRecipient.notificationStatuses,
  )
  notificationRecipient: NotificationRecipient;

  @ManyToOne(
    () => NotificationSchedule,
    (notificationSchedule) => notificationSchedule.notificationStatuses,
  )
  notificationSchedule: NotificationSchedule;
}
