import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { OtpType } from '@/modules/auth/enums/otp-type.enum';
import { getOtpEmailTemplate } from './templates/otp.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sends an OTP verification email to the user
   */
  async sendOtpEmail(
    toEmail: string,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    const expirationMinutes = Number(
      this.configService.get<number>('OTP_EXPIRATION_MINUTES', 5),
    );

    let subject = 'Caselink Verification Code';
    let title = 'Verification Code';
    let description = 'Use the code below to complete your verification:';

    if (type === OtpType.VERIFY_ACCOUNT) {
      subject = 'Caselink Account Registration Code';
      title = 'Verify Your Email';
      description =
        'Welcome to Caselink! Enter the verification code below to complete your account setup:';
    } else if (type === OtpType.LOGIN) {
      subject = 'Caselink Login Verification Code';
      title = 'Sign In to Caselink';
      description =
        'Use the 6-digit code below to sign in to your Caselink account:';
    } else if (type === OtpType.FORGOT_PASSWORD) {
      subject = 'Caselink Password Reset Request';
      title = 'Reset Your Password';
      description =
        'We received a request to reset your password. Enter the code below to proceed:';
    }

    const htmlContent = getOtpEmailTemplate(
      code,
      title,
      description,
      expirationMinutes,
    );

    const fromAddress = this.configService.get<string>(
      'EMAIL_FROM',
      'Caselink <noreply@caselink.uz>',
    );

    try {
      await this.mailerService.sendMail({
        to: toEmail,
        from: fromAddress,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (err: unknown) {
      this.logger.error(
        `Failed to send OTP email to ${toEmail} (type: ${type})`,
        err instanceof Error ? err.stack : err,
      );
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again later.',
      );
    }
  }
}
