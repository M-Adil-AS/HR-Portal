import { GlobalUsers } from 'src/user/global/global-user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { WorkQueueStatus } from './types/workqueue-status.type';

@Entity({ name: 'WorkQueue' })
export class WorkQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 50 })
  companyName: string;

  @Column({ type: 'varchar', length: 50 })
  userName: string;

  @Column({ type: 'varchar', unique: true, length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  password: string;

  @Column({ type: 'varchar', default: 'pending', length: 20 })
  status: WorkQueueStatus;

  @CreateDateColumn({ type: 'datetime', default: () => 'GETDATE()' })
  createdAt: Date;

  // Omitted the relationship because we can use @ManytoOne without using @OnetoMany. Don't really need the inverse relation on GlobalUsers
  @ManyToOne(() => GlobalUsers, {
    nullable: true,
  })
  accountManager: GlobalUsers | null;
}
