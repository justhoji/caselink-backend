import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
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
import { RegisterSendOtpDto } from '@/modules/auth/dto/register-send-otp.dto';
import { RegisterVerifyOtpDto } from '@/modules/auth/dto/register-verify-otp.dto';
import { RegisterSetPasswordDto } from '@/modules/auth/dto/register-set-password.dto';
import { RegisterCompleteDto } from '@/modules/auth/dto/register-complete.dto';
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
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
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
   * Helper to normalize identifier strings (lowercase email, trim whitespace)
   */
  private normalizeIdentifier(identifier: string): string {
    if (!identifier) return '';
    const trimmed = identifier.trim();
    return trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
  }

  /**
   * Helper to format clean page address slug
   */
  private formatSlug(slug: string): string {
    if (!slug) return '';
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Helper to find user by email or phone identifier
   */
  private async findByIdentifier(identifier: string): Promise<User | null> {
    const clean = this.normalizeIdentifier(identifier);
    return this.userRepository.findOne({
      where: [
        { email: clean },
        { phone: clean },
        { email: identifier },
        { phone: identifier },
      ],
    });
  }

  // ==========================================
  // ONBOARDING & REGISTRATION FLOW (4 STEPS)
  // ==========================================

  /**
   * STEP 1: Send registration verification code to email/phone
   */
  async registerSendOtp(dto: RegisterSendOtpDto) {
    const cleanIdentifier = this.normalizeIdentifier(dto.identifier);
    if (!cleanIdentifier) {
      throw new BadRequestException('Email or phone identifier is required.');
    }

    const existingUser = await this.findByIdentifier(cleanIdentifier);
    if (existingUser) {
      throw new ConflictException(
        'Email or phone number is already registered. Please sign in.',
      );
    }

    return this.sendOtp({
      identifier: cleanIdentifier,
      type: OtpType.VERIFY_ACCOUNT,
    });
  }

  /**
   * STEP 2: Verify the 6-digit OTP code received
   */
  async registerVerifyOtp(dto: RegisterVerifyOtpDto) {
    const cleanIdentifier = this.normalizeIdentifier(dto.identifier);
    await this.verifyOtpCode(cleanIdentifier, dto.code, OtpType.VERIFY_ACCOUNT);

    return {
      message: 'Contact verified successfully.',
      verifiedIdentifier: cleanIdentifier,
    };
  }

  /**
   * STEP 3: Password setting phase
   */
  async registerSetPassword(dto: RegisterSetPasswordDto) {
    const cleanIdentifier = this.normalizeIdentifier(dto.identifier);
    if (!cleanIdentifier) {
      throw new BadRequestException('Email or phone identifier is required.');
    }

    const existingUser = await this.findByIdentifier(cleanIdentifier);
    if (existingUser) {
      throw new ConflictException(
        'Email or phone number is already registered.',
      );
    }

    return {
      message: 'Password set successfully for onboarding.',
      identifier: cleanIdentifier,
    };
  }

  /**
   * Helper: Instant Slug Availability Check
   */
  async checkSlugAvailability(rawSlug: string) {
    const cleanSlug = this.formatSlug(rawSlug);
    if (!cleanSlug) {
      throw new BadRequestException('Invalid page address slug.');
    }

    const existingAgency = await this.agencyRepository.findOne({
      where: { slug: cleanSlug },
    });

    const isAvailable = !existingAgency;
    return {
      slug: cleanSlug,
      fullDomain: `${cleanSlug}.caselink.uz`,
      isAvailable,
      message: isAvailable
        ? `Page address '${cleanSlug}.caselink.uz' is available.`
        : `Page address '${cleanSlug}.caselink.uz' is already taken.`,
    };
  }

  /**
   * STEP 4 / FINAL: Complete registration with agency name, unique page address & optional password
   */
  async registerComplete(dto: RegisterCompleteDto) {
    const rawIdentifier = dto.email || dto.phone;
    if (!rawIdentifier) {
      throw new BadRequestException('Either email or phone must be provided.');
    }

    const cleanEmail = dto.email ? this.normalizeIdentifier(dto.email) : undefined;
    const cleanPhone = dto.phone ? this.normalizeIdentifier(dto.phone) : undefined;
    const cleanIdentifier = cleanEmail || cleanPhone || '';

    const existingUser = await this.findByIdentifier(cleanIdentifier);
    if (existingUser) {
      throw new ConflictException(
        'Email or phone number is already registered.',
      );
    }

    // Format & validate unique page address slug
    const cleanSlug = this.formatSlug(dto.slug);
    if (!cleanSlug) {
      throw new BadRequestException('Page address slug is required.');
    }

    const existingSlug = await this.agencyRepository.findOne({
      where: { slug: cleanSlug },
    });
    if (existingSlug) {
      throw new ConflictException(
        `Page address '${cleanSlug}.caselink.uz' is already taken. Please choose another address.`,
      );
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create Agency with unique page address slug
      const agency = manager.create(Agency, {
        name: dto.agencyName || 'Caselink',
        slug: cleanSlug,
        email: cleanEmail,
        phone: cleanPhone,
        website: `https://${cleanSlug}.caselink.uz`,
      });
      const savedAgency = await manager.save(agency);

      // 2. Create Owner User
      const user = manager.create(User, {
        agencyId: savedAgency.id,
        firstName: 'Agency',
        lastName: 'Owner',
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: StaffRole.OWNER,
        isEmailVerified: Boolean(cleanEmail),
        isPhoneVerified: Boolean(cleanPhone),
      });
      const savedUser = await manager.save(user);

      // 3. Issue JWT Token pair
      const tokens = await this.tokenService.generateTokenPair(
        savedUser,
        undefined,
        manager,
      );

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
        agency: {
          id: savedAgency.id,
          name: savedAgency.name,
          slug: savedAgency.slug,
          fullDomain: `${savedAgency.slug}.caselink.uz`,
          publicPageUrl: `https://${savedAgency.slug}.caselink.uz`,
        },
        ...tokens,
      };
    });
  }

  /**
   * Backwards compatible registerOwner wrapper calling registerComplete
   */
  async registerOwner(dto: RegisterOwnerDto) {
    const agencyName = (dto as any).agencyName || 'Caselink';
    const defaultSlug =
      agencyName.toLowerCase().replace(/[^a-z0-9]/g, '') +
      Math.floor(1000 + Math.random() * 9000);

    return this.registerComplete({
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      agencyName,
      slug: defaultSlug,
    });
  }

  // ==========================================
  // AUTHENTICATION & LOGIN FLOWS
  // ==========================================

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
    const cleanIdentifier = this.normalizeIdentifier(dto.identifier);

    if (dto.type === OtpType.LOGIN || dto.type === OtpType.FORGOT_PASSWORD) {
      const user = await this.findByIdentifier(cleanIdentifier);
      if (!user) {
        throw new NotFoundException(
          `No user account found with identifier '${dto.identifier}'. Please register first.`,
        );
      }
    }

    const existingOtp = await this.otpRepository.findOne({
      where: { identifier: cleanIdentifier, type: dto.type, isUsed: false },
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
      identifier: cleanIdentifier,
      codeHash,
      type: dto.type,
      expiresAt,
      resendAvailableAt,
    });
    await this.otpRepository.save(otp);

    console.log(
      `[OTP GENERATED] Identifier: ${cleanIdentifier} | Code: ${rawCode} | Type: ${dto.type}`,
    );

    return {
      message: `OTP sent to ${cleanIdentifier}. Valid for ${this.otpExpirationMinutes} minutes.`,
      devCode: rawCode,
    };
  }

  async loginWithOtp(dto: LoginOtpDto) {
    const cleanIdentifier = this.normalizeIdentifier(dto.identifier);
    const user = await this.findByIdentifier(cleanIdentifier);
    if (!user) {
      throw new UnauthorizedException(
        `User not found with identifier '${dto.identifier}'. Please register first.`,
      );
    }

    await this.verifyOtpCode(cleanIdentifier, dto.code, OtpType.LOGIN);

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
    const cleanIdentifier = this.normalizeIdentifier(identifier);
    const user = await this.findByIdentifier(cleanIdentifier);

    if (!user) {
      // Constant-time response to prevent account enumeration via timing side-channel
      await bcrypt.hash('dummy-constant-time-work', 10);
      return { message: 'If an account exists, an OTP has been sent.' };
    }

    await this.sendOtp({
      identifier: cleanIdentifier,
      type: OtpType.FORGOT_PASSWORD,
    });

    return { message: 'If an account exists, an OTP has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const cleanIdentifier = this.normalizeIdentifier(dto.identifier);
    const user = await this.findByIdentifier(cleanIdentifier);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    await this.verifyOtpCode(
      cleanIdentifier,
      dto.code,
      OtpType.FORGOT_PASSWORD,
    );

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully. You can now log in.' };
  }

  private async verifyOtpCode(
    identifier: string,
    code: string,
    type: OtpType,
  ) {
    const cleanIdentifier = this.normalizeIdentifier(identifier);
    const otp = await this.otpRepository.findOne({
      where: { identifier: cleanIdentifier, type, isUsed: false },
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
