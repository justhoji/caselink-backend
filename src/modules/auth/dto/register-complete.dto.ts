import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCompleteDto {
  @ApiPropertyOptional({
    example: 'owner@agency.com',
    description: 'Verified agency owner email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'Verified agency owner phone',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'SecurePassword123',
    description: 'Optional owner account password',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    example: 'Silk Road Travel',
    description: 'Agency business name',
  })
  @IsString()
  @IsNotEmpty()
  agencyName!: string;

  @ApiProperty({
    example: 'silkroad',
    description:
      'Unique page address slug (e.g. "silkroad" -> silkroad.caselink.uz)',
  })
  @IsString()
  @IsNotEmpty()
  slug!: string;
}
