import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';

@ApiTags('Admin Panel — Team Management')
@ApiBearerAuth()
@Controller('admin/team')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('members')
  @ApiOperation({
    summary: 'List all staff members belonging to the authenticated agency',
    description:
      'Retrieves tenant-isolated staff members (Owner, Manager, Coordinator).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of agency team members retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — missing or invalid JWT bearer token.',
  })
  getTeamMembers() {
    return this.usersService.findAllForCurrentAgency();
  }
}
