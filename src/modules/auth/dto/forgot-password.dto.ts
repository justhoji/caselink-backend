import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'owner@agency.com',
    description: 'Registered email address or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;
}
