import { Tenant } from 'src/tenant/tenant.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity({ name: 'GlobalUsers' })
export class GlobalUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 100 })
  email: string;

  // Must include phoneNumber if app supports sms/whatsapp Notifications

  @Column({ type: 'varchar', length: 20 })
  userType: 'app_user' | 'tenant_user';

  // If we wish to delete GlobalUsers automatically when Tenant is deleted: @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  @ManyToOne(() => Tenant, { nullable: true })
  tenant: Tenant;
}
