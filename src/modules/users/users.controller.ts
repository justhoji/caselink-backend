import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';

@ApiTags('Team')
@ApiBearerAuth()
@Controller('admin/team')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('members')
  @ApiOperation({
    summary: 'List all staff members belonging to the current agency',
  })
  getTeamMembers() {
    return this.usersService.findAllForCurrentAgency();
  }
}
