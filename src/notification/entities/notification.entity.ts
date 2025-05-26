import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { GlobalUsers } from 'src/user/global/global-user.entity';
import { NotificationType } from '../types/notification.type';
import { NotificationSchedule } from './notification-schedule.entity';
import { NotificationRecipient } from './notification-recipient.entity';

@Entity({ name: 'Notifications' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @CreateDateColumn({ type: 'datetime', default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ type: 'nvarchar', length: 'MAX' })
  data: string;

  @Column({ type: 'bit', default: false })
  isTenantActioned: boolean;

  @Column({ type: 'datetime', nullable: true, default: null })
  tenantActionedAt: Date | null;

  @ManyToOne(() => GlobalUsers, (user) => user.notificationsSent)
  sender: GlobalUsers;

  @OneToMany(() => NotificationSchedule, (schedule) => schedule.notification, {
    cascade: true,
  })
  schedules: NotificationSchedule[];

  @OneToMany(
    () => NotificationRecipient,
    (notificationRecipient) => notificationRecipient.notification,
    { cascade: true },
  )
  notificationRecipients: NotificationRecipient[];
}
