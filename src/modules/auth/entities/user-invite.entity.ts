import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { InviteStatus } from '@/modules/auth/enums/invite-status.enum';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { User } from '@/modules/auth/entities/user.entity';

@Entity('user_invites')
export class UserInvite extends BaseEntity {
  @Index()
  @Column({ name: 'agency_id', type: 'uuid' })
  agencyId!: string;

  @ManyToOne(() => Agency, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: Agency;

  @Index()
  @Column()
  email!: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
  })
  role!: StaffRole;

  @Index({ unique: true })
  @Column()
  token!: string;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status!: InviteStatus;

  @Column({ name: 'invited_by_user_id', type: 'uuid', nullable: true })
  invitedByUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedByUser!: User | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
