import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PackageFlightDto {
  @ApiProperty({ example: 'Uzbekistan Airways', description: 'Airline name' })
  @IsString()
  @IsNotEmpty()
  airline!: string;

  @ApiPropertyOptional({ example: 'HY-531', description: 'Flight number' })
  @IsOptional()
  @IsString()
  flightNumber?: string;

  @ApiProperty({
    example: 'TAS (Tashkent)',
    description: 'Departure airport / city',
  })
  @IsString()
  @IsNotEmpty()
  departureAirport!: string;

  @ApiProperty({
    example: 'SSH (Sharm El Sheikh)',
    description: 'Arrival airport / city',
  })
  @IsString()
  @IsNotEmpty()
  arrivalAirport!: string;

  @ApiPropertyOptional({
    example: '2026-09-01T08:30:00Z',
    description: 'Departure ISO timestamp',
  })
  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @ApiPropertyOptional({
    example: '2026-09-01T11:45:00Z',
    description: 'Arrival ISO timestamp',
  })
  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this flight is a return flight',
  })
  @IsOptional()
  @IsBoolean()
  isReturnFlight?: boolean;
}
