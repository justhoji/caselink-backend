import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Retrieves all staff users belonging to the current authenticated agency
   */
  async findAllForCurrentAgency(): Promise<User[]> {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    return this.userRepository.find({
      where: { agencyId },
      select: {
        id: true,
        agencyId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'ASC' },
    });
  }
}
