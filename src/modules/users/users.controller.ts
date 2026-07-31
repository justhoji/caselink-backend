import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';

@Controller('admin/team')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('members')
  getTeamMembers() {
    return this.usersService.findAllForCurrentAgency();
  }
}

