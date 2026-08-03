import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'owner@agency.com',
    description: 'Registered email address or phone number',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP reset code' })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({
    example: 'NewSecurePassword123',
    description: 'New password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
