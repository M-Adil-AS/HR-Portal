import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(
      this.configService.get<string>('SENDGRID_API_KEY') as string,
    );
  }

  async sendEmail(
    to: string[],
    action: string,
    dynamicTemplateData: { [key: string]: any },
  ): Promise<void> {
    const templateId = this.configService.get<string>(
      `SENDGRID_TEMPLATE_${action.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`,
    ) as string;

    if (!templateId)
      throw new InternalServerErrorException(
        `Email Template ID: ${templateId} does not exist!`,
      );

    const msg = {
      to,
      from: this.configService.get<string>('SENDGRID_SENDER_EMAIL') as string, // your verified sender email from SendGrid
      templateId,
      dynamicTemplateData,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      error.errorContext = 'Failed to send email!';
      throw error;
    }
  }
}
