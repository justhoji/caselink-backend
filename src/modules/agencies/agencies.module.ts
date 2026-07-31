import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { AgencyPageSection } from '@/modules/agencies/entities/agency-page-section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agency, AgencyPageSection])],
  exports: [TypeOrmModule],
})
export class AgenciesModule {}
