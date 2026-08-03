import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterSendOtpDto {
  @ApiProperty({
    example: 'owner@agency.com',
    description: 'Email address or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;
}
