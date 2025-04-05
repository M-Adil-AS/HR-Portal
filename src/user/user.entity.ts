import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'Users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', unique: true, length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 200 })
  password: string;

  @CreateDateColumn({ type: 'datetime', default: () => 'GETDATE()' })
  createdAt: Date;
}
