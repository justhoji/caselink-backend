import { IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageSectionKey } from '@/modules/agencies/enums/page-section-key.enum';

export class PageSectionItemDto {
  @ApiProperty({
    enum: PageSectionKey,
    example: PageSectionKey.BASIC_INFO,
    description: 'Unique section identifier key',
  })
  @IsEnum(PageSectionKey)
  sectionKey!: PageSectionKey;

  @ApiProperty({
    example: true,
    description: 'Whether this section is visible on public landing page',
  })
  @IsBoolean()
  isVisible!: boolean;

  @ApiProperty({
    example: 1,
    description:
      'Display order position on public landing page (1-based index)',
  })
  @IsNumber()
  @Min(1)
  sortOrder!: number;
}
