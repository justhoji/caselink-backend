import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgenciesService } from '@/modules/agencies/agencies.service';
import { UpdateAgencyProfileDto } from '@/modules/agencies/dto/update-agency-profile.dto';
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

@ApiTags('Admin Panel — Agency Profile')
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
      'Retrieves the full agency profile details (branding, contact, office location, working hours, social channels, review settings, and package visibility settings).',
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
}
