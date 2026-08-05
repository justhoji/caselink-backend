import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { AgencyPageSection } from '@/modules/agencies/entities/agency-page-section.entity';
import { AgenciesService } from '@/modules/agencies/agencies.service';
import { AgenciesController } from '@/modules/agencies/agencies.controller';
import { PublicAgenciesController } from '@/modules/agencies/public-agencies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Agency, AgencyPageSection])],
  controllers: [AgenciesController, PublicAgenciesController],
  providers: [AgenciesService],
  exports: [AgenciesService, TypeOrmModule],
})
export class AgenciesModule {}
