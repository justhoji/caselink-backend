import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '@/modules/auth/entities/user.entity';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';

export interface TokenPairResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtStaffPayload {
  sub: string;
  agencyId: string;
  role: string;
  domain: string;
  jti?: string;
  familyId?: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  private get jwtStaffSecret(): string {
    return this.configService.get<string>(
      'JWT_STAFF_SECRET',
      'super-secret-staff-key',
    );
  }

  private get accessExpiration(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
  }

  private get accessExpirationSeconds(): number {
    return Number(
      this.configService.get<number>('JWT_ACCESS_EXPIRATION_SECONDS', 900),
    );
  }

  private get refreshExpiration(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  private get refreshExpirationDays(): number {
    return Number(
      this.configService.get<number>('JWT_REFRESH_EXPIRATION_DAYS', 7),
    );
  }

  /**
   * Generates a short-lived access JWT + opaque hashed refresh token
   * Optionally accepts an EntityManager to execute within an active transaction.
   */
  async generateTokenPair(
    user: User,
    existingFamilyId?: string,
    manager?: EntityManager,
  ): Promise<TokenPairResult> {
    const familyId = existingFamilyId || randomUUID();
    const refreshId = randomUUID();

    const payload: JwtStaffPayload = {
      sub: user.id,
      agencyId: user.agencyId,
      role: user.role,
      domain: 'staff',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtStaffSecret,
      expiresIn: this.accessExpirationSeconds,
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: refreshId, familyId },
      {
        secret: this.jwtStaffSecret,
        expiresIn: `${this.refreshExpirationDays}d`,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(
      Date.now() + this.refreshExpirationDays * 24 * 60 * 60 * 1000,
    );

    const tokenEntity = this.refreshTokenRepository.create({
      id: refreshId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt,
    });

    if (manager) {
      await manager.save(RefreshToken, tokenEntity);
    } else {
      await this.refreshTokenRepository.save(tokenEntity);
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpirationSeconds,
    };
  }

  /**
   * Verifies a refresh token and checks for reuse/revocation
   */
  async verifyRefreshToken(refreshToken: string): Promise<JwtStaffPayload> {
    let payload: JwtStaffPayload;
    try {
      payload = this.jwtService.verify<JwtStaffPayload>(refreshToken, {
        secret: this.jwtStaffSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid refresh token payload.');
    }

    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { id: payload.jti },
    });

    // Reuse detection: if token missing or already revoked/used, revoke the ENTIRE family!
    if (!tokenRecord || tokenRecord.isRevoked) {
      // Use familyId from the record if available, otherwise fall back to
      // the JWT payload — this covers the case where the record was deleted.
      const familyId = tokenRecord?.familyId ?? payload.familyId;
      if (familyId) {
        await this.refreshTokenRepository.update(
          { familyId },
          { isRevoked: true },
        );
      }
      throw new UnauthorizedException(
        'Security Alert: Refresh token reuse detected. Revoking session.',
      );
    }

    // Mark current token as revoked (used)
    tokenRecord.isRevoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    return payload;
  }

  /**
   * Revokes all active refresh tokens for a user (logout)
   */
  async revokeUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
  }

  /**
   * Nightly cleanup: deletes refresh tokens that are both expired AND revoked
   * to prevent unbounded table growth.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
      isRevoked: true,
    });
    this.logger.log(
      `Refresh-token cleanup: removed ${result.affected ?? 0} expired/revoked token(s).`,
    );
  }
}
