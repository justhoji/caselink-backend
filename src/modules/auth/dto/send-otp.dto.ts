import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OtpType } from '@/modules/auth/enums/otp-type.enum';

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or phone

  @IsEnum(OtpType)
  type!: OtpType;
}
