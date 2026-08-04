import { IsEnum, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@/modules/agencies/enums/day-of-week.enum';

export class WorkingHourItemDto {
  @ApiProperty({
    enum: DayOfWeek,
    example: DayOfWeek.MONDAY,
    description: 'Day of the week',
  })
  @IsEnum(DayOfWeek)
  day!: DayOfWeek;

  @ApiProperty({
    example: true,
    description: 'Whether office is open on this day',
  })
  @IsBoolean()
  isWorkDay!: boolean;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Opening time (HH:mm)',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    example: '18:00',
    description: 'Closing time (HH:mm)',
  })
  @IsOptional()
  @IsString()
  endTime?: string;
}
