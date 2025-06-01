import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
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
  /*
    TypeORM automatically creates/expects a foreign key column using this pattern: {relationPropertyName} + "Id"
    In our case, the foreign key column is scheduleId (custom), rather than notificationScheduleId (default)
    Hence explicitly specify the custom foreign key column for relationship   
  */
  @JoinColumn({ name: 'scheduleId' })
  notificationSchedule: NotificationSchedule;
}
