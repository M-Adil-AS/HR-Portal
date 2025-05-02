import { Injectable } from '@nestjs/common';
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
    templateId: string,
    dynamicTemplateData: { [key: string]: any },
  ): Promise<void> {
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
