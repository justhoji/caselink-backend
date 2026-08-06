import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { User } from '@/modules/auth/entities/user.entity';
import { UserInvite } from '@/modules/auth/entities/user-invite.entity';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { InviteStatus } from '@/modules/auth/enums/invite-status.enum';
import { CreateInviteDto } from '@/modules/users/dto/create-invite.dto';
import { EmailService } from '@/modules/email/email.service';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserInvite)
    private readonly inviteRepository: Repository<UserInvite>,
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
    private readonly emailService: EmailService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Retrieves all active staff members belonging to the current agency
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

  /**
   * Creates and sends a new team member invitation (OWNER only)
   */
  async createInvite(
    inviterUserId: string,
    dto: CreateInviteDto,
  ): Promise<UserInvite> {
    if (dto.role === StaffRole.OWNER) {
      throw new BadRequestException(
        'Cannot assign OWNER role via team invite. Only MANAGER or COORDINATOR roles are allowed.',
      );
    }

    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const cleanEmail = dto.email.toLowerCase().trim();

    const inviter = await this.userRepository.findOne({
      where: { id: inviterUserId },
    });

    if (!inviter) {
      throw new NotFoundException('Authenticated inviter record not found.');
    }

    // Rule 1: Cannot invite yourself
    if (inviter.email && inviter.email.toLowerCase().trim() === cleanEmail) {
      throw new BadRequestException(
        'You cannot send a team invitation to your own email address.',
      );
    }

    // Rule 2: Cannot invite an existing staff member
    const existingUser = await this.userRepository.findOne({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      if (existingUser.agencyId === agencyId) {
        throw new BadRequestException(
          `A team member with email '${cleanEmail}' already exists in your agency (current role: ${existingUser.role}).`,
        );
      } else {
        throw new BadRequestException(
          `A staff member with email '${cleanEmail}' is already registered on Caselink.`,
        );
      }
    }

    // Revoke any existing PENDING invitation for this email in this agency
    const existingPendingInvite = await this.inviteRepository.findOne({
      where: { email: cleanEmail, agencyId, status: InviteStatus.PENDING },
    });
    if (existingPendingInvite) {
      existingPendingInvite.status = InviteStatus.REVOKED;
      await this.inviteRepository.save(existingPendingInvite);
    }

    const agency = await this.agencyRepository.findOne({
      where: { id: agencyId },
    });
    if (!agency) {
      throw new NotFoundException('Agency profile not found.');
    }

    const inviterName = `${inviter.firstName} ${inviter.lastName}`.trim();

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invite = this.inviteRepository.create({
      agencyId,
      email: cleanEmail,
      role: dto.role,
      token,
      status: InviteStatus.PENDING,
      invitedByUserId: inviterUserId,
      expiresAt,
    });

    const savedInvite = await this.inviteRepository.save(invite);

    // Dispatch email
    await this.emailService.sendTeamInviteEmail(
      cleanEmail,
      agency.name,
      dto.role,
      token,
      inviterName,
    );

    return savedInvite;
  }

  /**
   * Retrieves all team invitations for the current agency
   */
  async findAllInvitesForCurrentAgency(): Promise<UserInvite[]> {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const invites = await this.inviteRepository.find({
      where: { agencyId },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    let hasUpdates = false;

    // Check for expired invitations and update status
    for (const inv of invites) {
      if (inv.status === InviteStatus.PENDING && inv.expiresAt < now) {
        inv.status = InviteStatus.EXPIRED;
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await this.inviteRepository.save(invites);
    }

    return invites;
  }

  /**
   * Revokes a pending team invitation (OWNER only)
   */
  async revokeInvite(inviteId: string): Promise<{ message: string }> {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId, agencyId },
    });

    if (!invite) {
      throw new NotFoundException('Team invitation not found.');
    }

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException(
        `Cannot revoke invitation with status '${invite.status}'. Only PENDING invitations can be revoked.`,
      );
    }

    invite.status = InviteStatus.REVOKED;
    await this.inviteRepository.save(invite);

    return { message: 'Team invitation revoked successfully.' };
  }
}
