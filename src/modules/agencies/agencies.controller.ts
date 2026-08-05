import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  Request,
  ParseArrayPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgenciesService } from '@/modules/agencies/agencies.service';
import { UpdateAgencyProfileDto } from '@/modules/agencies/dto/update-agency-profile.dto';
import { PageSectionItemDto } from '@/modules/agencies/dto/update-page-sections.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/modules/auth/guards/roles.guard';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';

interface AuthenticatedRequest {
  user: {
    userId: string;
    agencyId: string;
    role: StaffRole;
  };
}

@ApiTags('Admin Panel — Agency Profile & Page Layout Builder')
@ApiBearerAuth()
@Controller('admin/agency')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantContextInterceptor)
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current agency profile',
    description:
      'Retrieves full agency profile details (branding, contact, office location, working hours, social channels, review settings, and package visibility settings).',
  })
  @ApiResponse({
    status: 200,
    description: 'Agency profile retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.agenciesService.getProfile(req.user.agencyId);
  }

  @Patch()
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Update agency profile (OWNER / MANAGER)',
    description:
      'Updates agency profile fields. Requires 6 mandatory fields (name, shortDescription, phone, email, city, address) along with optional branding, social, working hours, and review settings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agency profile updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing mandatory fields or invalid inputs.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden — Insufficient role permissions (Coordinator role cannot update profile).',
  })
  updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateAgencyProfileDto,
  ) {
    return this.agenciesService.updateProfile(req.user.agencyId, dto);
  }

  @Get('sections')
  @ApiOperation({
    summary: 'Get agency landing page section order & visibility',
    description:
      'Retrieves the list of 8 landing page sections (MEDIA, BASIC_INFO, CONTACT, ADDRESS, WORKING_HOURS, SOCIAL_MEDIA, REVIEWS, PACKAGES) ordered by sortOrder.',
  })
  @ApiResponse({
    status: 200,
    description: 'Section layout configuration retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  getSections(@Request() req: AuthenticatedRequest) {
    return this.agenciesService.getSections(req.user.agencyId);
  }

  @Patch('sections')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary:
      'Update agency landing page section order & visibility (OWNER / MANAGER)',
    description:
      'Atomically updates display order (sortOrder) and visibility (isVisible) for all landing page sections.',
  })
  @ApiBody({
    type: [PageSectionItemDto],
    description: 'Array of section configurations',
  })
  @ApiResponse({
    status: 200,
    description: 'Section layout configuration updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Validation error.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — Insufficient role permissions.',
  })
  updateSections(
    @Request() req: AuthenticatedRequest,
    @Body(new ParseArrayPipe({ items: PageSectionItemDto }))
    dtos: PageSectionItemDto[],
  ) {
    return this.agenciesService.updateSections(req.user.agencyId, dtos);
  }
}
