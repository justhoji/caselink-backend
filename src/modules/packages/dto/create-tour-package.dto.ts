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
import { PackageHotelDto } from '@/modules/packages/dto/package-hotel.dto';
import { PackageMediaDto } from '@/modules/packages/dto/package-media.dto';
import { PackageFlightDto } from '@/modules/packages/dto/package-flight.dto';
import { PackageExtraDto } from '@/modules/packages/dto/package-extra.dto';

export class CreateTourPackageDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  destination!: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageHotelDto)
  hotels?: PackageHotelDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageMediaDto)
  media?: PackageMediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageFlightDto)
  flights?: PackageFlightDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageExtraDto)
  extras?: PackageExtraDto[];
}
