import { Body, Controller, Param, Patch, Post, Version } from '@nestjs/common';
import { WorkqueueService } from './workqueue.service';
import { Serialize } from 'src/decorators/interceptors';
import { SubmitOnboardingDto } from './dtos/submit-onboarding.dto';
import { WorkQueueDto } from './dtos/workqueue.dto';
import { UpdateOnboardingDto } from './dtos/update-onboarding.dto';

@Controller('workqueue')
export class WorkqueueController {
  constructor(private workqueueService: WorkqueueService) {}

  //TODO: Add Captcha
  @Serialize(WorkQueueDto)
  @Version('1')
  @Post()
  async submitOnboardingRequest(@Body() body: SubmitOnboardingDto) {
    const onboardingRequest: WorkQueueDto =
      await this.workqueueService.submitOnboardingRequest(body);

    return { data: onboardingRequest, message: 'Successfully submitted!' };
  }

  @Serialize(WorkQueueDto)
  @Version('1')
  @Patch(':id/update')
  async updateOnboardingRequest(
    @Param('id') workqueueId: string,
    @Body() body: UpdateOnboardingDto,
  ) {
    const onboardingRequest: WorkQueueDto =
      await this.workqueueService.updateOnboardingRequest(workqueueId, body);

    return { data: onboardingRequest, message: 'Successfully updated!' };
  }
}
