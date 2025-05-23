import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { GlobalUsers } from '../global/global-user.entity';

@Entity({ name: 'AppUsers' })
export class AppUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  password: string;

  @CreateDateColumn({ type: 'datetime', default: () => 'GETDATE()' })
  createdAt: Date;

  @Column({ type: 'bit', default: false })
  isDeleted: boolean;

  // Join Column must be used in one of entities having one-one relationship with another entity. Should be used in the entity which owns the foreign key
  // If you wish to delete AppUser automatically when GlobalUser is deleted: @OneToOne(() => GlobalUsers, (globalUser) => globalUser.appUser, { onDelete: 'CASCADE' })
  @OneToOne(() => GlobalUsers, (globalUser) => globalUser.appUser)
  @JoinColumn({ name: 'globalUserId' }) // Specifies that globalUserId is the foreign key
  globalUser: GlobalUsers;
}
