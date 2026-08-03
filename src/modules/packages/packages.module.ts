import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourPackage } from '@/modules/packages/entities/tour-package.entity';
import { PackageHotel } from '@/modules/packages/entities/package-hotel.entity';
import { PackageMedia } from '@/modules/packages/entities/package-media.entity';
import { PackageFlight } from '@/modules/packages/entities/package-flight.entity';
import { PackageExtra } from '@/modules/packages/entities/package-extra.entity';
import { PackagesService } from '@/modules/packages/packages.service';
import { PackagesController } from '@/modules/packages/packages.controller';
import { TenantModule } from '@/common/tenant/tenant.module';

@Module({
  imports: [
    // TenantModule provides TenantContextService used by PackagesService
    TenantModule,
    TypeOrmModule.forFeature([
      TourPackage,
      PackageHotel,
      PackageMedia,
      PackageFlight,
      PackageExtra,
    ]),
  ],
  controllers: [PackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
