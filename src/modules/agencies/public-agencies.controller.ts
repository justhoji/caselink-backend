import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgenciesService } from '@/modules/agencies/agencies.service';

@ApiTags('Client App — Public Agency Landing Page')
@Controller('public/agencies')
export class PublicAgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get(':slug')
  @ApiOperation({
    summary: 'Get public agency landing page layout & hydrated content',
    description:
      'Fetches agency by slug and returns an ordered array of hydrated landing page sections containing ONLY visible section content for public rendering.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Public agency landing page layout and hydrated sections retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found — Agency slug does not exist.',
  })
  getPublicLandingPage(@Param('slug') slug: string) {
    return this.agenciesService.getPublicLandingPage(slug);
  }
}
