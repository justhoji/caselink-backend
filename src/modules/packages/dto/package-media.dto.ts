import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackageMediaType } from '@/modules/packages/enums/package-media-type.enum';

export class PackageMediaDto {
  @ApiProperty({
    example: 'http://localhost:3000/uploads/agencies/.../img1.jpg',
    description: 'Public media URL',
  })
  @IsString()
  @IsNotEmpty()
  mediaUrl!: string;

  @ApiPropertyOptional({
    enum: PackageMediaType,
    example: PackageMediaType.IMAGE,
    description: 'Media type (IMAGE or VIDEO)',
  })
  @IsOptional()
  @IsEnum(PackageMediaType)
  mediaType?: PackageMediaType;

  @ApiPropertyOptional({
    example: 'Pool view at sunset',
    description: 'Caption or title',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    example: 1920,
    description: 'Image / video width in pixels',
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({
    example: 1080,
    description: 'Image / video height in pixels',
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ example: 'image/jpeg', description: 'MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 0, description: 'Display sort order' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
