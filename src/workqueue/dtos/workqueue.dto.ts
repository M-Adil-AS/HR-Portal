import { Expose, Type } from 'class-transformer';
import { UserDto } from 'src/user/dtos/user.dto';
import { WorkQueueStatus } from '../types/workqueue-status.type';

export class WorkQueueDto {
  @Expose()
  id: string;

  @Expose()
  userName: string;

  @Expose()
  email: string;

  @Expose()
  companyName: string;

  @Expose()
  status: WorkQueueStatus;

  @Expose()
  @Type(() => UserDto)
  accountManager: UserDto | null;
}
