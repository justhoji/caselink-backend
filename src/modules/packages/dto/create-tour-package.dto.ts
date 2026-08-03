import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackageHotelDto } from '@/modules/packages/dto/package-hotel.dto';
import { PackageMediaDto } from '@/modules/packages/dto/package-media.dto';
import { PackageFlightDto } from '@/modules/packages/dto/package-flight.dto';
import { PackageExtraDto } from '@/modules/packages/dto/package-extra.dto';

export class CreateTourPackageDto {
  @ApiProperty({
    example: '10 Days in Sharm El Sheikh',
    description: 'Title of the tour package',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Sharm El Sheikh, Egypt',
    description: 'Destination city / region',
  })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/uploads/agencies/.../cover.jpg',
    description: 'Public URL of cover image',
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({
    example: '2026-09-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({ example: '2026-09-11', description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({
    example:
      'Experience 10 luxurious days on the Red Sea coast with all-inclusive hotel stays and diving excursions.',
    description: 'Detailed package description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether package is published for public catalog',
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether package is featured on agency landing page',
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    type: [PackageHotelDto],
    description: 'Hotel options with individual pricing',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageHotelDto)
  hotels?: PackageHotelDto[];

  @ApiPropertyOptional({
    type: [PackageMediaDto],
    description: 'Additional media gallery items (images / videos)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageMediaDto)
  media?: PackageMediaDto[];

  @ApiPropertyOptional({
    type: [PackageFlightDto],
    description: 'Flight itinerary details',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFlightDto)
  flights?: PackageFlightDto[];

  @ApiPropertyOptional({
    type: [PackageExtraDto],
    description: 'Included package extra perks / services',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageExtraDto)
  extras?: PackageExtraDto[];
}
