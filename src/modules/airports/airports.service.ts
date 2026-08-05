import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { Airport } from '@/modules/airports/entities/airport.entity';
import { QueryAirportsDto } from '@/modules/airports/dto/query-airports.dto';

interface RawAirportData {
  icao?: string;
  iata?: string;
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  elevation?: number;
  lat?: number;
  lon?: number;
  tz?: string;
}

@Injectable()
export class AirportsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AirportsService.name);

  constructor(
    @InjectRepository(Airport)
    private readonly airportRepository: Repository<Airport>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAirportsIfEmpty();
  }

  /**
   * Bulk seeds airports from airports.json into PostgreSQL if table is empty
   */
  async seedAirportsIfEmpty(): Promise<void> {
    // Ensure table and indexes exist in PostgreSQL
    await this.airportRepository.query(`
      CREATE TABLE IF NOT EXISTS airports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        icao VARCHAR(50) UNIQUE NOT NULL,
        iata VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        city VARCHAR(255),
        state VARCHAR(255),
        country VARCHAR(255),
        lat DECIMAL(10,7),
        lon DECIMAL(10,7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports(icao);
      CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata);
      CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
    `);

    let count = 0;
    try {
      count = await this.airportRepository.count();
    } catch {
      count = 0;
    }

    if (count > 0) {
      return;
    }

    const jsonPath = join(process.cwd(), 'airports.json');
    if (!existsSync(jsonPath)) {
      this.logger.warn(
        `airports.json not found at ${jsonPath}. Skipping airport seeding.`,
      );
      return;
    }

    this.logger.log(
      'Seeding 29,308 airports from airports.json into PostgreSQL...',
    );
    const rawContent = readFileSync(jsonPath, 'utf8');
    const airportsMap = JSON.parse(rawContent) as Record<
      string,
      RawAirportData
    >;

    const entries = Object.entries(airportsMap);
    const batchSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
      const chunkEntries = entries.slice(i, i + batchSize);
      const values = chunkEntries.map(([key, data]) => ({
        icao: data.icao || key,
        iata: data.iata || undefined,
        name: data.name || 'Unknown Airport',
        city: data.city || undefined,
        state: data.state || undefined,
        country: data.country || undefined,
        lat: data.lat !== undefined ? Number(data.lat) : undefined,
        lon: data.lon !== undefined ? Number(data.lon) : undefined,
      }));

      await this.airportRepository
        .createQueryBuilder()
        .insert()
        .into(Airport)
        .values(values)
        .orIgnore()
        .execute();

      insertedCount += values.length;
    }

    this.logger.log(
      `Airport seeding complete! Total ${insertedCount} airports inserted.`,
    );
  }

  /**
   * High-performance search for airports optimized for frontend autocomplete dropdowns.
   * Searches across ICAO code, IATA code, city name, and airport name.
   */
  async searchAirports(query: QueryAirportsDto): Promise<Partial<Airport>[]> {
    const search = query.search?.trim();
    const limit = query.limit || 20;

    const qb = this.airportRepository
      .createQueryBuilder('airport')
      .select([
        'airport.id',
        'airport.icao',
        'airport.iata',
        'airport.name',
        'airport.city',
        'airport.state',
        'airport.country',
      ])
      .limit(limit);

    if (!search) {
      return qb.orderBy('airport.name', 'ASC').getMany();
    }

    const cleanSearch = search.toUpperCase();

    // Prioritize exact or prefix matches on IATA/ICAO code, then city or name
    qb.where('UPPER(airport.iata) = :exactSearch', { exactSearch: cleanSearch })
      .orWhere('UPPER(airport.icao) = :exactSearch', {
        exactSearch: cleanSearch,
      })
      .orWhere('UPPER(airport.iata) LIKE :prefixSearch', {
        prefixSearch: `${cleanSearch}%`,
      })
      .orWhere('UPPER(airport.icao) LIKE :prefixSearch', {
        prefixSearch: `${cleanSearch}%`,
      })
      .orWhere('LOWER(airport.city) LIKE LOWER(:termSearch)', {
        termSearch: `${search}%`,
      })
      .orWhere('LOWER(airport.name) LIKE LOWER(:termSearch)', {
        termSearch: `%${search}%`,
      })
      .orderBy(
        `CASE 
          WHEN UPPER(airport.iata) = '${cleanSearch}' THEN 1
          WHEN UPPER(airport.icao) = '${cleanSearch}' THEN 2
          WHEN UPPER(airport.iata) LIKE '${cleanSearch}%' THEN 3
          WHEN UPPER(airport.icao) LIKE '${cleanSearch}%' THEN 4
          WHEN LOWER(airport.city) LIKE LOWER('${search}%') THEN 5
          ELSE 6
        END`,
        'ASC',
      )
      .addOrderBy('airport.name', 'ASC');

    return qb.getMany();
  }
}
