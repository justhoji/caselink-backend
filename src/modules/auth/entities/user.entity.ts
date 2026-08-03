import {
  Entity,
  Column,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { Agency } from '@/modules/agencies/entities/agency.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ name: 'agency_id', type: 'uuid' })
  agencyId!: string;

  @ManyToOne(() => Agency, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: Agency;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Index({ unique: true, where: 'email IS NOT NULL' })
  @Column({ nullable: true })
  email!: string;

  @Index({ unique: true, where: 'phone IS NOT NULL' })
  @Column({ nullable: true })
  phone!: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
    default: StaffRole.OWNER,
  })
  role!: StaffRole;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'lockout_until', type: 'timestamp', nullable: true })
  lockoutUntil!: Date | null;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified!: boolean;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date;
}
