import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { TourPackage } from '@/modules/packages/entities/tour-package.entity';
import { PackageHotel } from '@/modules/packages/entities/package-hotel.entity';
import { PackageMedia } from '@/modules/packages/entities/package-media.entity';
import { PackageFlight } from '@/modules/packages/entities/package-flight.entity';
import { PackageExtra } from '@/modules/packages/entities/package-extra.entity';
import { CreateTourPackageDto } from '@/modules/packages/dto/create-tour-package.dto';
import { UpdateTourPackageDto } from '@/modules/packages/dto/update-tour-package.dto';
import { QueryTourPackagesDto } from '@/modules/packages/dto/query-tour-packages.dto';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(TourPackage)
    private readonly packageRepository: Repository<TourPackage>,
    private readonly tenantContextService: TenantContextService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Helper to generate a URL-friendly unique slug from title
   */
  private generateSlug(title: string): string {
    const cleanTitle = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const shortHash = randomUUID().substring(0, 6);
    return `${cleanTitle}-${shortHash}`;
  }

  /**
   * Helper to validate package dates
   */
  private parseAndValidateDates(startDateStr: string, endDateStr: string) {
    if (!startDateStr || !endDateStr) {
      throw new BadRequestException('Both startDate and endDate are required.');
    }
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate format.');
    }
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate.');
    }
    return { startDate: start, endDate: end };
  }

  /**
   * Creates a new TourPackage aggregate inside a single atomic transaction
   */
  async createPackage(dto: CreateTourPackageDto): Promise<TourPackage> {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const slug = this.generateSlug(dto.title);
    const { startDate, endDate } = this.parseAndValidateDates(
      dto.startDate,
      dto.endDate,
    );

    return this.dataSource.transaction(async (manager) => {
      // 1. Create parent TourPackage entity
      const pkg = manager.create(TourPackage, {
        agencyId,
        title: dto.title,
        slug,
        destination: dto.destination,
        coverImageUrl: dto.coverImageUrl,
        description: dto.description,
        isPublished: dto.isPublished ?? false,
        isFeatured: dto.isFeatured ?? false,
        startDate,
        endDate,
      });
      const savedPkg = await manager.save(TourPackage, pkg);

      // 2. Create child Hotels (with hotel-specific pricing) if provided
      if (dto.hotels?.length) {
        const hotelEntities = dto.hotels.map((h, index) =>
          manager.create(PackageHotel, {
            ...h,
            packageId: savedPkg.id,
            sortOrder: h.sortOrder ?? index,
          }),
        );
        await manager.save(PackageHotel, hotelEntities);
      }

      // 3. Create child Media if provided
      if (dto.media?.length) {
        const mediaEntities = dto.media.map((m, index) =>
          manager.create(PackageMedia, {
            ...m,
            packageId: savedPkg.id,
            sortOrder: m.sortOrder ?? index,
          }),
        );
        await manager.save(PackageMedia, mediaEntities);
      }

      // 4. Create child Flights if provided
      if (dto.flights?.length) {
        const flightEntities = dto.flights.map((f) =>
          manager.create(PackageFlight, {
            ...f,
            packageId: savedPkg.id,
            departureTime: f.departureTime
              ? new Date(f.departureTime)
              : undefined,
            arrivalTime: f.arrivalTime ? new Date(f.arrivalTime) : undefined,
          }),
        );
        await manager.save(PackageFlight, flightEntities);
      }

      // 5. Create child Extras if provided
      if (dto.extras?.length) {
        const extraEntities = dto.extras.map((e) =>
          manager.create(PackageExtra, {
            ...e,
            packageId: savedPkg.id,
          }),
        );
        await manager.save(PackageExtra, extraEntities);
      }

      // Fetch complete aggregate tree
      return manager.findOne(TourPackage, {
        where: { id: savedPkg.id },
        relations: { hotels: true, media: true, flights: true, extras: true },
      }) as Promise<TourPackage>;
    });
  }

  /**
   * Retrieves tenant-scoped tour packages with pagination & filters
   */
  async findAllPackages(query: QueryTourPackagesDto) {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.packageRepository
      .createQueryBuilder('pkg')
      .leftJoinAndSelect('pkg.hotels', 'hotels')
      .leftJoinAndSelect('pkg.media', 'media')
      .leftJoinAndSelect('pkg.flights', 'flights')
      .leftJoinAndSelect('pkg.extras', 'extras')
      .where('pkg.agency_id = :agencyId', { agencyId });

    if (query.search) {
      qb.andWhere(
        '(pkg.title ILIKE :search OR pkg.destination ILIKE :search OR pkg.description ILIKE :search OR hotels.hotel_name ILIKE :search OR flights.departure_airport ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.isPublished !== undefined) {
      qb.andWhere('pkg.is_published = :isPublished', {
        isPublished: query.isPublished,
      });
    }

    if (query.currency) {
      qb.andWhere('hotels.currency = :currency', { currency: query.currency });
    }

    if (query.pricingType) {
      qb.andWhere('hotels.pricing_type = :pricingType', {
        pricingType: query.pricingType,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere(
        '(COALESCE(hotels.price_adult, hotels.price_batch_total) >= :minPrice)',
        { minPrice: query.minPrice },
      );
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere(
        '(COALESCE(hotels.price_adult, hotels.price_batch_total) <= :maxPrice)',
        { maxPrice: query.maxPrice },
      );
    }

    qb.orderBy('pkg.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single tour package aggregate by ID for current agency
   */
  async findPackageById(id: string): Promise<TourPackage> {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const pkg = await this.packageRepository.findOne({
      where: { id, agencyId },
      relations: { hotels: true, media: true, flights: true, extras: true },
    });

    if (!pkg) {
      throw new NotFoundException(`Tour package not found.`);
    }

    return pkg;
  }

  /**
   * Updates a TourPackage aggregate inside a single atomic transaction
   */
  async updatePackage(
    id: string,
    dto: UpdateTourPackageDto,
  ): Promise<TourPackage> {
    const existingPkg = await this.findPackageById(id);

    return this.dataSource.transaction(async (manager) => {
      // 1. Update parent entity fields
      if (dto.title && dto.title !== existingPkg.title) {
        existingPkg.slug = this.generateSlug(dto.title);
      }

      let startDate = existingPkg.startDate;
      let endDate = existingPkg.endDate;

      if (dto.startDate || dto.endDate) {
        const startStr = dto.startDate || existingPkg.startDate.toISOString();
        const endStr = dto.endDate || existingPkg.endDate.toISOString();
        const parsed = this.parseAndValidateDates(startStr, endStr);
        startDate = parsed.startDate;
        endDate = parsed.endDate;
      }

      Object.assign(existingPkg, {
        ...dto,
        startDate,
        endDate,
      });

      await manager.save(TourPackage, existingPkg);

      // 2. Replace child Hotels (with hotel-specific pricing) if provided
      if (dto.hotels != null) {
        await manager.delete(PackageHotel, { packageId: id });
        if (dto.hotels.length) {
          const hotelEntities = dto.hotels.map((h, index) =>
            manager.create(PackageHotel, {
              ...h,
              packageId: id,
              sortOrder: h.sortOrder ?? index,
            }),
          );
          await manager.save(PackageHotel, hotelEntities);
        }
      }

      // 3. Replace child Media if provided
      if (dto.media != null) {
        await manager.delete(PackageMedia, { packageId: id });
        if (dto.media.length) {
          const mediaEntities = dto.media.map((m, index) =>
            manager.create(PackageMedia, {
              ...m,
              packageId: id,
              sortOrder: m.sortOrder ?? index,
            }),
          );
          await manager.save(PackageMedia, mediaEntities);
        }
      }

      // 4. Replace child Flights if provided
      if (dto.flights != null) {
        await manager.delete(PackageFlight, { packageId: id });
        if (dto.flights.length) {
          const flightEntities = dto.flights.map((f) =>
            manager.create(PackageFlight, {
              ...f,
              packageId: id,
              departureTime: f.departureTime
                ? new Date(f.departureTime)
                : undefined,
              arrivalTime: f.arrivalTime ? new Date(f.arrivalTime) : undefined,
            }),
          );
          await manager.save(PackageFlight, flightEntities);
        }
      }

      // 5. Replace child Extras if provided
      if (dto.extras != null) {
        await manager.delete(PackageExtra, { packageId: id });
        if (dto.extras.length) {
          const extraEntities = dto.extras.map((e) =>
            manager.create(PackageExtra, {
              ...e,
              packageId: id,
            }),
          );
          await manager.save(PackageExtra, extraEntities);
        }
      }

      // Return updated package tree
      return manager.findOne(TourPackage, {
        where: { id },
        relations: { hotels: true, media: true, flights: true, extras: true },
      }) as Promise<TourPackage>;
    });
  }

  /**
   * Soft-deletes a tour package by setting deleted_at timestamp
   */
  async softDeletePackage(id: string): Promise<{ message: string }> {
    const pkg = await this.findPackageById(id);
    await this.packageRepository.softDelete(pkg.id);
    return { message: `Tour package '${pkg.title}' has been deleted.` };
  }

  /**
   * Toggles publish status of a tour package
   */
  async togglePublishStatus(
    id: string,
    isPublished: boolean,
  ): Promise<TourPackage> {
    const pkg = await this.findPackageById(id);
    pkg.isPublished = isPublished;
    return this.packageRepository.save(pkg);
  }
}
