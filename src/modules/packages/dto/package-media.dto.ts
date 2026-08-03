import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { PackageMediaType } from '@/modules/packages/enums/package-media-type.enum';

export class PackageMediaDto {
  @IsString()
  @IsNotEmpty()
  mediaUrl!: string;

  @IsOptional()
  @IsEnum(PackageMediaType)
  mediaType?: PackageMediaType;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
