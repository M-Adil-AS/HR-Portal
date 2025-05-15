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

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  tenant: Tenant;
}

//TODO: onDelete CASCADE to onDelete NO ACTION?
//TODO: INT IDENTITY(1,1) WARNING
