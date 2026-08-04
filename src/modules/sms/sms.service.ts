import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpType } from '@/modules/auth/enums/otp-type.enum';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  private get gatewayUrl(): string {
    return this.configService.get<string>(
      'SMS_GATEWAY_URL',
      'http://10.1.1.97:3000/api/v2',
    );
  }

  private get apiKey(): string {
    return this.configService.get<string>('SMS_API_KEY', '');
  }

  private get apiSecret(): string {
    return this.configService.get<string>('SMS_API_SECRET', '');
  }

  /**
   * Resolves the gateway template ID dynamically based on OTP type
   */
  private getTemplateId(type: OtpType): number {
    const defaultTemplateId = Number(
      this.configService.get<number>('SMS_TEMPLATE_ID', 10),
    );

    switch (type) {
      case OtpType.VERIFY_ACCOUNT:
        return Number(
          this.configService.get<number>(
            'SMS_TEMPLATE_ID_VERIFY',
            defaultTemplateId,
          ),
        );
      case OtpType.LOGIN:
        return Number(
          this.configService.get<number>(
            'SMS_TEMPLATE_ID_LOGIN',
            defaultTemplateId,
          ),
        );
      case OtpType.FORGOT_PASSWORD:
        return Number(
          this.configService.get<number>(
            'SMS_TEMPLATE_ID_FORGOT_PASSWORD',
            defaultTemplateId,
          ),
        );
      default:
        return defaultTemplateId;
    }
  }

  /**
   * Helper to format phone number to clean 12-digit numeric format (e.g. 998901234567)
   */
  private formatPhoneNumber(phone: string): number {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 9) {
      throw new BadRequestException(`Invalid phone number format: '${phone}'.`);
    }
    const full12Digit = clean.length === 9 ? `998${clean}` : clean;
    return Number(full12Digit);
  }

  /**
   * Sends an OTP verification code via Company SMS Gateway API (/api/v2/sms/request)
   * aware of the OTP purpose type (VERIFY_ACCOUNT, LOGIN, FORGOT_PASSWORD).
   */
  async sendOtpSms(phone: string, code: string, type: OtpType): Promise<void> {
    const formattedPhone = this.formatPhoneNumber(phone);
    const resolvedTemplateId = this.getTemplateId(type);

    // Development / Mock Fallback if API keys are not provided
    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn(
        `[MOCK SMS SENDER] SMS_API_KEY / SMS_API_SECRET not set in .env. ` +
          `Dispatched [${type}] OTP code '${code}' to phone '${formattedPhone}' (templateId=${resolvedTemplateId}).`,
      );
      return;
    }

    const endpoint = `${this.gatewayUrl}/sms/request`;
    const payload = {
      template_id: resolvedTemplateId,
      send_by_phonenumber: true,
      receivers: [formattedPhone],
      placeholders: {
        [formattedPhone]: {
          code: code,
          type: type,
        },
      },
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-API-Secret': this.apiSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Company SMS Gateway error (${response.status}): ${errorText}`,
        );
        throw new Error(`SMS gateway responded with HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (data.success === false) {
        this.logger.error(
          `Company SMS Gateway payload error: ${data.error || 'Unknown error'}`,
        );
        throw new Error(data.error || 'Failed to dispatch SMS via gateway.');
      }

      this.logger.log(
        `Successfully dispatched [${type}] OTP SMS code to phone '${formattedPhone}' via Company SMS Gateway (Template ${resolvedTemplateId}).`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send [${type}] SMS to phone '${formattedPhone}': ${message}`,
      );
      throw new BadRequestException(
        'Failed to dispatch SMS verification code. Please check your phone number or try again later.',
      );
    }
  }
}
