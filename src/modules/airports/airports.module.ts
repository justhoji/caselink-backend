import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Airport } from '@/modules/airports/entities/airport.entity';
import { AirportsService } from '@/modules/airports/airports.service';
import { AirportsController } from '@/modules/airports/airports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Airport])],
  controllers: [AirportsController],
  providers: [AirportsService],
  exports: [AirportsService],
})
export class AirportsModule {}
