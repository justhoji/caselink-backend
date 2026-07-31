import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@/modules/auth/entities/user.entity';
import { Otp } from '@/modules/auth/entities/otp.entity';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { RegisterOwnerDto } from '@/modules/auth/dto/register-owner.dto';
import { LoginPasswordDto } from '@/modules/auth/dto/login-password.dto';
import { SendOtpDto } from '@/modules/auth/dto/send-otp.dto';
import { LoginOtpDto } from '@/modules/auth/dto/login-otp.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { RefreshTokenDto } from '@/modules/auth/dto/refresh-token.dto';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { OtpType } from '@/modules/auth/enums/otp-type.enum';
import { TokenService } from '@/modules/auth/services/token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  private get maxFailedAttempts(): number {
    return Number(
      this.configService.get<number>('AUTH_MAX_FAILED_ATTEMPTS', 5),
    );
  }

  private get lockoutMinutes(): number {
    return Number(this.configService.get<number>('AUTH_LOCKOUT_MINUTES', 15));
  }

  private get otpCooldownSeconds(): number {
    return Number(this.configService.get<number>('OTP_COOLDOWN_SECONDS', 60));
  }

  private get otpExpirationMinutes(): number {
    return Number(this.configService.get<number>('OTP_EXPIRATION_MINUTES', 5));
  }

  /**
   * Helper to find user by email or phone identifier
   */
  private async findByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });
  }

  async registerOwner(dto: RegisterOwnerDto) {
    const identifier = dto.email || dto.phone;
    if (!identifier) {
      throw new BadRequestException('Either email or phone must be provided.');
    }

    const existingUser = await this.findByIdentifier(identifier);
    if (existingUser) {
      throw new ConflictException('Email or phone number already registered.');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.dataSource.transaction(async (manager) => {
      const agency = manager.create(Agency, {
        name: 'Caselink',
        email: dto.email,
        phone: dto.phone,
      });
      const savedAgency = await manager.save(agency);

      const user = manager.create(User, {
        agencyId: savedAgency.id,
        firstName: 'Agency',
        lastName: 'Owner',
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: StaffRole.OWNER,
      });
      const savedUser = await manager.save(user);

      const tokens = await this.tokenService.generateTokenPair(savedUser);
      return {
        user: {
          id: savedUser.id,
          agencyId: savedUser.agencyId,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          email: savedUser.email,
          phone: savedUser.phone,
          role: savedUser.role,
        },
        ...tokens,
      };
    });
  }

  async loginWithPassword(dto: LoginPasswordDto) {
    const user = await this.findByIdentifier(dto.identifier);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60),
      );
      throw new HttpException(
        `Account is temporarily locked due to failed login attempts. Try again in ${remainingMinutes} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Password login not configured for this account.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= this.maxFailedAttempts) {
        user.lockoutUntil = new Date(
          Date.now() + this.lockoutMinutes * 60 * 1000,
        );
      }
      await this.userRepository.save(user);

      const attemptsLeft = Math.max(
        0,
        this.maxFailedAttempts - user.failedLoginAttempts,
      );
      if (attemptsLeft === 0) {
        throw new HttpException(
          `Account locked due to failed attempts. Please try again after ${this.lockoutMinutes} minutes or use OTP login.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException(
        `Invalid credentials. ${attemptsLeft} attempt(s) remaining.`,
      );
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await this.userRepository.save(user);

    const tokens = await this.tokenService.generateTokenPair(user);
    return {
      user: {
        id: user.id,
        agencyId: user.agencyId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  async sendOtp(dto: SendOtpDto) {
    const existingOtp = await this.otpRepository.findOne({
      where: { identifier: dto.identifier, type: dto.type, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (existingOtp && existingOtp.resendAvailableAt > new Date()) {
      const waitSeconds = Math.ceil(
        (existingOtp.resendAvailableAt.getTime() - Date.now()) / 1000,
      );
      throw new HttpException(
        `Please wait ${waitSeconds} second(s) before requesting a new OTP.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(rawCode, 10);

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.otpExpirationMinutes * 60 * 1000,
    );
    const resendAvailableAt = new Date(
      now.getTime() + this.otpCooldownSeconds * 1000,
    );

    const otp = this.otpRepository.create({
      identifier: dto.identifier,
      codeHash,
      type: dto.type,
      expiresAt,
      resendAvailableAt,
    });
    await this.otpRepository.save(otp);

    console.log(
      `[OTP GENERATED] Identifier: ${dto.identifier} | Code: ${rawCode} | Type: ${dto.type}`,
    );

    return {
      message: `OTP sent to ${dto.identifier}. Valid for ${this.otpExpirationMinutes} minutes.`,
      devCode: rawCode,
    };
  }

  async loginWithOtp(dto: LoginOtpDto) {
    const user = await this.findByIdentifier(dto.identifier);
    if (!user) {
      throw new UnauthorizedException(
        'User not found with provided identifier.',
      );
    }

    await this.verifyOtpCode(dto.identifier, dto.code, OtpType.LOGIN);

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await this.userRepository.save(user);

    const tokens = await this.tokenService.generateTokenPair(user);
    return {
      user: {
        id: user.id,
        agencyId: user.agencyId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  async forgotPassword(identifier: string) {
    const user = await this.findByIdentifier(identifier);
    if (!user) {
      return { message: 'If account exists, an OTP has been sent.' };
    }
    return this.sendOtp({ identifier, type: OtpType.FORGOT_PASSWORD });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.findByIdentifier(dto.identifier);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    await this.verifyOtpCode(dto.identifier, dto.code, OtpType.FORGOT_PASSWORD);

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully. You can now log in.' };
  }

  private async verifyOtpCode(identifier: string, code: string, type: OtpType) {
    const otp = await this.otpRepository.findOne({
      where: { identifier, type, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('No active OTP request found.');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code.');
    }

    otp.isUsed = true;
    await this.otpRepository.save(otp);
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return this.tokenService.generateTokenPair(user, payload.familyId);
  }

  async logout(userId: string) {
    await this.tokenService.revokeUserTokens(userId);
    return { message: 'Logged out successfully.' };
  }
}
