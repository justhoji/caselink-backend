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

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'resend_available_at', type: 'timestamp' })
  resendAvailableAt!: Date;

  @Column({ name: 'is_used', default: false })
  isUsed!: boolean;
}
