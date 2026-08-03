import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class PackageFlightDto {
  @IsString()
  @IsNotEmpty()
  airline!: string;

  @IsOptional()
  @IsString()
  flightNumber?: string;

  @IsString()
  @IsNotEmpty()
  departureAirport!: string;

  @IsString()
  @IsNotEmpty()
  arrivalAirport!: string;

  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsBoolean()
  isReturnFlight?: boolean;
}
