import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '@/modules/users/users.service';
import { CreateInviteDto } from '@/modules/users/dto/create-invite.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/modules/auth/guards/roles.guard';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    agencyId: string;
    role: StaffRole;
  };
}

@ApiTags('Admin Panel — Team Management')
@ApiBearerAuth()
@Controller('admin/team')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Post('invites')
  @Roles(StaffRole.OWNER)
  @ApiOperation({
    summary: 'Invite a new team member via email (OWNER only)',
    description:
      'Generates a secure 48-hour invitation token, creates an invitation record, and emails a magic registration link to the target member.',
  })
  @ApiResponse({
    status: 201,
    description: 'Team invitation created and email sent successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request — Member already exists or attempting to invite another OWNER.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — Insufficient role permissions (OWNER only).',
  })
  createInvite(@Req() req: AuthenticatedRequest, @Body() dto: CreateInviteDto) {
    return this.usersService.createInvite(req.user.userId, dto);
  }

  @Get('invites')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'List all team invitations for current agency (OWNER / MANAGER)',
    description:
      'Retrieves all pending, accepted, expired, and revoked invitations.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of team invitations retrieved successfully.',
  })
  getTeamInvites() {
    return this.usersService.findAllInvitesForCurrentAgency();
  }

  @Delete('invites/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.OWNER)
  @ApiOperation({
    summary: 'Revoke a pending team invitation (OWNER only)',
    description: 'Marks a pending team invitation as REVOKED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Team invitation revoked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invitation is not in PENDING status.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found — Invitation does not exist.',
  })
  revokeInvite(@Param('id') id: string) {
    return this.usersService.revokeInvite(id);
  }
}
