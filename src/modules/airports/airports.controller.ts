import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AirportsService } from '@/modules/airports/airports.service';
import { QueryAirportsDto } from '@/modules/airports/dto/query-airports.dto';

@ApiTags('Airports')
@Controller('airports')
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @HttpCode(HttpStatus.OK)
  @Get()
  @ApiOperation({
    summary: 'Search & list airports (optimized for frontend autocomplete)',
    description:
      'Exposes airport info (ICAO code, IATA code, name, city, state, country). Fast autocomplete search across ICAO, IATA, city, and airport name.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching airports retrieved successfully.',
  })
  searchAirports(@Query() query: QueryAirportsDto) {
    return this.airportsService.searchAirports(query);
  }
}
