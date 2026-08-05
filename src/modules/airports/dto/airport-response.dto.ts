import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AirportResponseDto {
  @ApiProperty({ example: '71be5c4a-5914-4e86-b52b-54908935fec9' })
  id!: string;

  @ApiProperty({
    example: 'UZTT',
    description: '4-letter ICAO airport code',
  })
  icao!: string;

  @ApiPropertyOptional({
    example: 'TAS',
    description: '3-letter IATA airport code (e.g. TAS, LHR, JFK)',
    nullable: true,
  })
  iata?: string | null;

  @ApiProperty({
    example: 'Tashkent International Airport',
    description: 'Full official name of the airport',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Tashkent',
    description: 'City where the airport is located',
    nullable: true,
  })
  city?: string | null;

  @ApiPropertyOptional({
    example: 'Toshkent-Shahri',
    description: 'State or region',
    nullable: true,
  })
  state?: string | null;

  @ApiPropertyOptional({
    example: 'UZ',
    description: '2-letter ISO country code',
    nullable: true,
  })
  country?: string | null;
}
