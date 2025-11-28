import { IsUUID } from 'class-validator';

// Validators throw Errors in order: bottom to up

export class UpdateOnboardingDto {
  @IsUUID()
  accountManagerId: string;
}
