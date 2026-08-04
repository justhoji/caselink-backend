import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkingHourItemDto } from '@/modules/agencies/dto/working-hour-item.dto';
import { PackageSortOption } from '@/modules/agencies/enums/package-sort-option.enum';

export class UpdateAgencyProfileDto {
  @ApiProperty({
    example: 'Silk Road Travel',
    description: 'Agency business name',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Premier travel agency in Central Asia',
    description: 'Short tagline or tagline summary',
  })
  @IsString()
  @IsNotEmpty()
  shortDescription!: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Primary contact phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: 'info@silkroad.uz',
    description: 'Public support/inquiry email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Tashkent', description: 'Office city' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    example: 'Amir Timur street 14/2',
    description: 'Physical office street address',
  })
  @IsString()
  @IsNotEmpty()
  address!: string;

  // Optional Media & Branding
  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/agencies/.../logo.png',
    description: 'Public URL of agency logo',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/agencies/.../cover.jpg',
    description: 'Public URL of landing page hero cover banner',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  // Optional Long Description
  @ApiPropertyOptional({
    example:
      'Founded in 2020, we offer custom tour packages across Uzbekistan and worldwide.',
    description: 'Full agency history or about us text',
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  // Optional Geographic Coordinates
  @ApiPropertyOptional({
    example: 41.311081,
    description: 'Latitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 69.240562,
    description: 'Longitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  // Optional Working Hours Schedule
  @ApiPropertyOptional({
    type: [WorkingHourItemDto],
    description: 'Weekly working hours schedule',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourItemDto)
  workingHours?: WorkingHourItemDto[];

  // Optional Social Media Channels
  @ApiPropertyOptional({
    example: '+998901234567',
    description: 'WhatsApp contact number or link',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({
    example: 'https://facebook.com/silkroad',
    description: 'Facebook page URL',
  })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({
    example: 'https://t.me/silkroad_travel',
    description: 'Telegram channel or contact username/link',
  })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiPropertyOptional({
    example: 'https://instagram.com/silkroad_travel',
    description: 'Instagram handle or URL',
  })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({
    example: 'https://youtube.com/@silkroad_travel',
    description: 'YouTube channel URL',
  })
  @IsOptional()
  @IsString()
  youtube?: string;

  @ApiPropertyOptional({
    example: 'https://silkroad.uz',
    description: 'Official website URL',
  })
  @IsOptional()
  @IsString()
  website?: string;

  // Optional Reviews Moderation Settings
  @ApiPropertyOptional({
    example: true,
    description: 'Toggle customer reviews display on landing page',
  })
  @IsOptional()
  @IsBoolean()
  isReviewsEnabled?: boolean;

  @ApiPropertyOptional({
    example: 4,
    description: 'Minimum review stars to show (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minStarsToShow?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum reviews shown on landing page',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxReviewsCount?: number;

  // Optional Package Display & Visibility Settings
  @ApiPropertyOptional({
    example: 12,
    description: 'Number of packages to feature on landing page',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  packagesDisplayCount?: number;

  @ApiPropertyOptional({
    enum: PackageSortOption,
    example: PackageSortOption.POPULARITY,
    description: 'Default sorting strategy for packages',
  })
  @IsOptional()
  @IsEnum(PackageSortOption)
  packagesSortBy?: PackageSortOption;
}
