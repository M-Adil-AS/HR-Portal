import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Notification } from './notification.entity';
import { GlobalUsers } from '../../user/global/global-user.entity';
import { NotificationStatus } from './notification-status.entity';

@Entity({ name: 'NotificationRecipient' })
export class NotificationRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bit', default: false })
  isUserActioned: boolean;

  @Column({ type: 'datetime', nullable: true, default: null })
  userActionedAt: Date | null;

  @ManyToOne(
    () => Notification,
    (notification) => notification.notificationRecipients,
  )
  notification: Notification;

  @ManyToOne(() => GlobalUsers, (user) => user.notificationRecipients)
  recipient: GlobalUsers;

  @OneToMany(
    () => NotificationStatus,
    (notificationStatus) => notificationStatus.notificationRecipient,
    { cascade: true },
  )
  notificationStatuses: NotificationStatus[];
}
