import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpType } from '@/modules/auth/enums/otp-type.enum';

export class SendOtpDto {
  @ApiProperty({
    example: 'owner@agency.com',
    description: 'Email address or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    enum: OtpType,
    example: OtpType.LOGIN,
    description: 'Purpose of OTP code (VERIFY_ACCOUNT, LOGIN, FORGOT_PASSWORD)',
  })
  @IsEnum(OtpType)
  type!: OtpType;
}
