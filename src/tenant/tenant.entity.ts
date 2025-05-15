import { Company } from 'src/company/company.entity';
import { GlobalUsers } from 'src/user/global/global-user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'Tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 53 })
  dbName: string;

  @Column({ type: 'varchar', unique: true, length: 66 })
  login: string;

  @Column({ type: 'text' })
  encryptedPassword: string;

  @Column({ type: 'char', length: 32 })
  salt: string;

  @Column({ type: 'char', length: 32 })
  iv: string;

  // Join Column must be used in one of entities having one-one relationship with another entity. Should be used in the entity which owns the foreign key
  // onDelete Cascade so that if Company is Deleted then Tenant is also Deleted maintaining Referential Intergrity.
  @OneToOne(() => Company, (company) => company.tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' }) // Specifies that companyId is the foreign key
  company: Company;

  @OneToMany(() => GlobalUsers, (user) => user.tenant, { cascade: true })
  users: GlobalUsers[];
}
