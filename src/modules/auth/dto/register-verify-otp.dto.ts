import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterVerifyOtpDto {
  @ApiProperty({
    example: 'owner@agency.com',
    description: 'Email address or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP verification code',
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}
