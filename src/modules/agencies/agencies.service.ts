import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { AgencyPageSection } from '@/modules/agencies/entities/agency-page-section.entity';
import { UpdateAgencyProfileDto } from '@/modules/agencies/dto/update-agency-profile.dto';
import { PageSectionItemDto } from '@/modules/agencies/dto/update-page-sections.dto';
import { PageSectionKey } from '@/modules/agencies/enums/page-section-key.enum';

const DEFAULT_SECTIONS: { sectionKey: PageSectionKey; sortOrder: number }[] = [
  { sectionKey: PageSectionKey.MEDIA, sortOrder: 1 },
  { sectionKey: PageSectionKey.BASIC_INFO, sortOrder: 2 },
  { sectionKey: PageSectionKey.CONTACT, sortOrder: 3 },
  { sectionKey: PageSectionKey.ADDRESS, sortOrder: 4 },
  { sectionKey: PageSectionKey.WORKING_HOURS, sortOrder: 5 },
  { sectionKey: PageSectionKey.SOCIAL_MEDIA, sortOrder: 6 },
  { sectionKey: PageSectionKey.REVIEWS, sortOrder: 7 },
  { sectionKey: PageSectionKey.PACKAGES, sortOrder: 8 },
];

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
    @InjectRepository(AgencyPageSection)
    private readonly sectionRepository: Repository<AgencyPageSection>,
  ) {}

  /**
   * Fetches the current agency profile by agencyId
   */
  async getProfile(agencyId: string): Promise<Agency> {
    const agency = await this.agencyRepository.findOne({
      where: { id: agencyId },
    });

    if (!agency) {
      throw new NotFoundException('Agency profile not found.');
    }

    return agency;
  }

  /**
   * Updates current agency profile
   */
  async updateProfile(
    agencyId: string,
    dto: UpdateAgencyProfileDto,
  ): Promise<Agency> {
    const agency = await this.getProfile(agencyId);

    // Update mandatory fields
    agency.name = dto.name;
    agency.shortDescription = dto.shortDescription;
    agency.phone = dto.phone;
    agency.email = dto.email;
    agency.city = dto.city;
    agency.officeAddress = dto.address;

    // Update optional fields if provided
    if (dto.logoUrl !== undefined) agency.logoUrl = dto.logoUrl;
    if (dto.coverImageUrl !== undefined) agency.coverUrl = dto.coverImageUrl;
    if (dto.longDescription !== undefined)
      agency.longDescription = dto.longDescription;
    if (dto.latitude !== undefined) agency.latitude = dto.latitude;
    if (dto.longitude !== undefined) agency.longitude = dto.longitude;
    if (dto.workingHours !== undefined) agency.workingHours = dto.workingHours;

    // Social links
    if (dto.whatsapp !== undefined) agency.whatsapp = dto.whatsapp;
    if (dto.facebook !== undefined) agency.facebook = dto.facebook;
    if (dto.telegram !== undefined) agency.telegram = dto.telegram;
    if (dto.instagram !== undefined) agency.instagram = dto.instagram;
    if (dto.youtube !== undefined) agency.youtube = dto.youtube;
    if (dto.website !== undefined) agency.website = dto.website;

    // Reviews settings
    if (dto.isReviewsEnabled !== undefined)
      agency.isReviewsEnabled = dto.isReviewsEnabled;
    if (dto.minStarsToShow !== undefined)
      agency.minReviewStars = dto.minStarsToShow;
    if (dto.maxReviewsCount !== undefined)
      agency.maxReviewsShown = dto.maxReviewsCount;

    // Packages display settings
    if (dto.packagesDisplayCount !== undefined)
      agency.maxPackagesShown = dto.packagesDisplayCount;
    if (dto.packagesSortBy !== undefined)
      agency.packagesSortBy = dto.packagesSortBy;

    return this.agencyRepository.save(agency);
  }

  /**
   * Retrieves page section order & visibility configuration for an agency.
   * Auto-seeds the default 8 sections if no custom configuration exists.
   */
  async getSections(agencyId: string): Promise<AgencyPageSection[]> {
    const existingSections = await this.sectionRepository.find({
      where: { agencyId },
      order: { sortOrder: 'ASC' },
    });

    if (existingSections.length > 0) {
      return existingSections;
    }

    // Seed default 8 sections
    const defaultEntities = DEFAULT_SECTIONS.map((sec) =>
      this.sectionRepository.create({
        agencyId,
        sectionKey: sec.sectionKey,
        isVisible: true,
        sortOrder: sec.sortOrder,
      }),
    );

    return this.sectionRepository.save(defaultEntities);
  }

  /**
   * Atomically updates page section order & visibility configuration
   */
  async updateSections(
    agencyId: string,
    dtos: PageSectionItemDto[],
  ): Promise<AgencyPageSection[]> {
    const existingSections = await this.sectionRepository.find({
      where: { agencyId },
    });

    const existingMap = new Map<PageSectionKey, AgencyPageSection>();
    for (const sec of existingSections) {
      existingMap.set(sec.sectionKey, sec);
    }

    const updatedEntities: AgencyPageSection[] = [];

    for (const item of dtos) {
      let entity = existingMap.get(item.sectionKey);

      if (entity) {
        entity.isVisible = item.isVisible;
        entity.sortOrder = item.sortOrder;
      } else {
        entity = this.sectionRepository.create({
          agencyId,
          sectionKey: item.sectionKey,
          isVisible: item.isVisible,
          sortOrder: item.sortOrder,
        });
      }

      updatedEntities.push(entity);
    }

    await this.sectionRepository.save(updatedEntities);

    return this.getSections(agencyId);
  }
}
