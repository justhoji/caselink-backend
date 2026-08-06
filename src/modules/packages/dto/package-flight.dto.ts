import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlightClass } from '@/modules/packages/enums/flight-class.enum';

export class PackageFlightDto {
  @ApiProperty({ example: 'Uzbekistan Airways', description: 'Airline name' })
  @IsString()
  @IsNotEmpty()
  airline!: string;

  @ApiPropertyOptional({ example: 'HY-531', description: 'Flight number' })
  @IsOptional()
  @IsString()
  flightNumber?: string;

  @ApiPropertyOptional({
    enum: FlightClass,
    example: FlightClass.ECONOMY,
    description: 'Cabin flight class (ECONOMY, BUSINESS, FIRST)',
  })
  @IsOptional()
  @IsEnum(FlightClass)
  flightClass?: FlightClass;

  @ApiProperty({
    example: 'TAS (Tashkent)',
    description:
      'Departure airport (can differ between outbound & return flights)',
  })
  @IsString()
  @IsNotEmpty()
  departureAirport!: string;

  @ApiProperty({
    example: 'SSH (Sharm El Sheikh)',
    description:
      'Arrival airport (can differ between outbound & return flights)',
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
    description: 'Whether this flight is a return flight segment',
  })
  @IsOptional()
  @IsBoolean()
  isReturnFlight?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether luggage allowance is included with this flight',
  })
  @IsOptional()
  @IsBoolean()
  isLuggageIncluded?: boolean;

  @ApiPropertyOptional({
    example: '23 kg',
    description:
      'Luggage allowance details if enabled (e.g., 23 kg, 20 kg, 2x23 kg)',
  })
  @IsOptional()
  @IsString()
  luggageAllowance?: string;
}
