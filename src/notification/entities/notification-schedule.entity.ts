import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationStatus } from './notification-status.entity';

@Entity({ name: 'NotificationSchedule' })
export class NotificationSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime' })
  actionDateTime: Date;

  @ManyToOne(() => Notification, (notification) => notification.schedules)
  notification: Notification;

  @OneToMany(
    () => NotificationStatus,
    (notificationStatus) => notificationStatus.notificationSchedule,
    {
      cascade: true,
    },
  )
  notificationStatuses: NotificationStatus[];
}
