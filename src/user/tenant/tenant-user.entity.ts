import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// No Foreign Relationship between TenantUsers and Company/Tenant because of cross-database
// No companyId or tenantId key required in Tenant DB Tables
// Request (JWT: tenantId) -> Connect to Tenant DB -> Get All Users of that particular company/tenant

@Entity({ name: 'Users' })
export class TenantUsers {
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
