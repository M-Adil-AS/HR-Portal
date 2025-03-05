import { Tenant } from 'src/tenant/tenant.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'Companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  domain: string;

  @CreateDateColumn({ type: 'datetime', default: () => 'GETDATE()' })
  createdAt: Date;

  // cascade true so that any changes applied to Company Instance will also affect the related Tenant Instance.
  // Example: company.tenant.dbName=xyz, companyRepository.save(company)
  // cascade true applied to Company instead of Tenant because Tenant will only exist if a Company exists in the first place because companyId is foreign key in Tenant.
  // OnDelete Cascade on Tenant must remain even though we are using cascade true here. Because OnDelete is a DB-Level Feature & TypeORM must remian synced with DB Schema. While cascade true is TypeORM-Level Feature.
  @OneToOne(() => Tenant, (tenant) => tenant.company, { cascade: true })
  tenant: Tenant;
}
