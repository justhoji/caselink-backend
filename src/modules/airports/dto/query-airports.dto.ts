import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAirportsDto {
  @ApiPropertyOptional({
    example: 'Tashkent',
    description:
      'Search query by ICAO code (e.g. UTTT), IATA code (e.g. TAS), airport name, or city',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Maximum number of results to return (default 20, max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
