import { IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PackageSectionKey } from '@/modules/packages/enums/package-section-key.enum';

export class PackageSectionConfigDto {
  @ApiProperty({
    enum: PackageSectionKey,
    example: PackageSectionKey.HOTELS,
    description:
      'Re-orderable package section key (HOTELS, FLIGHTS, EXTRAS, MEDIA)',
  })
  @IsEnum(PackageSectionKey)
  key!: PackageSectionKey;

  @ApiProperty({
    example: 1,
    description: 'Display order sequence (1-based index)',
  })
  @IsInt()
  @Min(1)
  sortOrder!: number;

  @ApiProperty({
    example: true,
    description: 'Whether this section is visible on public catalog page',
  })
  @IsBoolean()
  isVisible!: boolean;
}
