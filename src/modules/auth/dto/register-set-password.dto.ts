import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterSetPasswordDto {
  @ApiProperty({
    example: 'owner@agency.com',
    description: 'Email address or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
