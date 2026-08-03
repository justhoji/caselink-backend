import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { OtpType } from '@/modules/auth/enums/otp-type.enum';

@Entity('otps')
export class Otp extends BaseEntity {
  @Index()
  @Column()
  identifier!: string; // email or phone

  @Column({ name: 'code_hash' })
  codeHash!: string;

  @Column({
    type: 'enum',
    enum: OtpType,
  })
  type!: OtpType;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date;

  @Column({ name: 'resend_available_at', type: 'timestamptz', nullable: true })
  resendAvailableAt!: Date;

  @Column({ name: 'is_used', default: false })
  isUsed!: boolean;

  /**
   * Tracks the number of failed verification attempts for this OTP.
   * Used to enforce brute-force lockout (see AUTH_OTP_MAX_ATTEMPTS env).
   */
  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedAttempts!: number;
}
