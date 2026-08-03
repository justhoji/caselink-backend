import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PackageExtraDto {
  @ApiProperty({
    example: 'Guided Pyramids Tour',
    description: 'Title of extra service or perk',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    example: 'Full-day excursion with private guide and lunch included',
    description: 'Description of extra',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this extra is included in package base price',
  })
  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  @ApiPropertyOptional({
    example: 45,
    description: 'Additional price if add-on (0 if included)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalPrice?: number;
}
