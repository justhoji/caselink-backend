import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginPasswordDto {
  @ApiProperty({
    example: 'owner@agency.com',
    description: 'Email address or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
