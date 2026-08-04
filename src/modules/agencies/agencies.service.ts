import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { UpdateAgencyProfileDto } from '@/modules/agencies/dto/update-agency-profile.dto';

@Injectable()
export class AgenciesService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
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
}
