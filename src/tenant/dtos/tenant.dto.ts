import { Expose } from 'class-transformer';

export class TenantDto {
  @Expose()
  id: string;
}
