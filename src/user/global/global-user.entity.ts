import { Tenant } from 'src/tenant/tenant.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { AppUsers } from '../app/app-user.entity';
import { UserType } from '../enums/user-type.enum';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationRecipient } from 'src/notification/entities/notification-recipient.entity';

@Entity({ name: 'GlobalUsers' })
export class GlobalUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 100 })
  email: string;

  // Must include phoneNumber if app supports sms/whatsapp Notifications

  @Column({ type: 'varchar', length: 20 })
  userType: UserType;

  // If we wish to delete GlobalUsers automatically when Tenant is deleted: @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  @ManyToOne(() => Tenant, { nullable: true })
  tenant: Tenant | null;

  @OneToOne(() => AppUsers, (appUser) => appUser.globalUser, { cascade: true })
  appUser?: AppUsers;

  @OneToMany(() => Notification, (notification) => notification.sender, {
    cascade: true,
  })
  notificationsSent: Notification[];

  @OneToMany(
    () => NotificationRecipient,
    (notificationRecipient) => notificationRecipient.recipient,
    { cascade: true },
  )
  notificationRecipients: NotificationRecipient[];
}
