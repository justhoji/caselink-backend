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
import { UserInvite } from '@/modules/auth/entities/user-invite.entity';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { RegisterSendOtpDto } from '@/modules/auth/dto/register-send-otp.dto';
import { RegisterVerifyOtpDto } from '@/modules/auth/dto/register-verify-otp.dto';
import { RegisterSetPasswordDto } from '@/modules/auth/dto/register-set-password.dto';
import { RegisterCompleteDto } from '@/modules/auth/dto/register-complete.dto';
import { LoginPasswordDto } from '@/modules/auth/dto/login-password.dto';
import { SendOtpDto } from '@/modules/auth/dto/send-otp.dto';
import { LoginOtpDto } from '@/modules/auth/dto/login-otp.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { RefreshTokenDto } from '@/modules/auth/dto/refresh-token.dto';
import { AcceptInviteDto } from '@/modules/auth/dto/accept-invite.dto';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { OtpType } from '@/modules/auth/enums/otp-type.enum';
import { InviteStatus } from '@/modules/auth/enums/invite-status.enum';
import { TokenService } from '@/modules/auth/services/token.service';
import { EmailService } from '@/modules/email/email.service';
import { SmsService } from '@/modules/sms/sms.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(UserInvite)
    private readonly inviteRepository: Repository<UserInvite>,
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
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
   * Maximum number of wrong guesses allowed per OTP before it is invalidated.
   * Prevents brute-force of the 6-digit code space.
   */
  private get otpMaxAttempts(): number {
    return Number(this.configService.get<number>('AUTH_OTP_MAX_ATTEMPTS', 5));
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
   * Helper to find user by email or phone identifier.
   * Uses a single normalized value to avoid duplicate OR conditions.
   */
  private async findByIdentifier(identifier: string): Promise<User | null> {
    const clean = this.normalizeIdentifier(identifier);
    return this.userRepository.findOne({
      where: [{ email: clean }, { phone: clean }],
    });
  }

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
   * STEP 3: Password setting phase.
   * Requires a successfully completed VERIFY_ACCOUNT OTP for the identifier.
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

    // Guard: ensure OTP verification (step 2) was completed before accepting password
    await this.assertOtpWasVerified(cleanIdentifier, OtpType.VERIFY_ACCOUNT);

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
   * STEP 4 / FINAL: Complete registration with agency name, unique page address & optional password.
   * Requires that VERIFY_ACCOUNT OTP was completed for the email/phone.
   */
  async registerComplete(dto: RegisterCompleteDto) {
    const rawIdentifier = dto.email || dto.phone;
    if (!rawIdentifier) {
      throw new BadRequestException('Either email or phone must be provided.');
    }

    const cleanEmail = dto.email
      ? this.normalizeIdentifier(dto.email)
      : undefined;
    const cleanPhone = dto.phone
      ? this.normalizeIdentifier(dto.phone)
      : undefined;
    const cleanIdentifier = cleanEmail || cleanPhone || '';

    const existingUser = await this.findByIdentifier(cleanIdentifier);
    if (existingUser) {
      throw new ConflictException(
        'Email or phone number is already registered.',
      );
    }

    // Guard: ensure OTP verification was completed for either email or phone
    let isVerified = false;
    if (cleanPhone) {
      try {
        await this.assertOtpWasVerified(cleanPhone, OtpType.VERIFY_ACCOUNT);
        isVerified = true;
      } catch {
        // Phone not verified, fallback to email check below
      }
    }
    if (!isVerified && cleanEmail) {
      await this.assertOtpWasVerified(cleanEmail, OtpType.VERIFY_ACCOUNT);
      isVerified = true;
    }
    if (!isVerified) {
      throw new BadRequestException(
        'Contact verification is required. Please complete OTP verification first.',
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
        website: `https://caselink.uz/${cleanSlug}.`,
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

    // Dispatch OTP via Email or SMS depending on identifier type
    if (cleanIdentifier.includes('@')) {
      await this.emailService.sendOtpEmail(cleanIdentifier, rawCode, dto.type);
    } else {
      await this.smsService.sendOtpSms(cleanIdentifier, rawCode, dto.type);
    }

    return {
      message: `OTP sent to ${cleanIdentifier}. Valid for ${this.otpExpirationMinutes} minutes.`,
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

  /**
   * Verifies an OTP code. Tracks failed attempts and invalidates the OTP
   * after AUTH_OTP_MAX_ATTEMPTS wrong guesses to prevent brute-force attacks.
   */
  private async verifyOtpCode(identifier: string, code: string, type: OtpType) {
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

    // Brute-force guard: invalidate OTP after too many wrong attempts
    if (otp.failedAttempts >= this.otpMaxAttempts) {
      otp.isUsed = true; // treat as consumed so it cannot be guessed further
      await this.otpRepository.save(otp);
      throw new HttpException(
        'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      otp.failedAttempts += 1;
      await this.otpRepository.save(otp);

      const attemptsLeft = Math.max(
        0,
        this.otpMaxAttempts - otp.failedAttempts,
      );
      throw new BadRequestException(
        `Invalid OTP code. ${attemptsLeft} attempt(s) remaining.`,
      );
    }

    otp.isUsed = true;
    await this.otpRepository.save(otp);
  }

  /**
   * Asserts that a VERIFY_ACCOUNT OTP was successfully completed (isUsed = true)
   * for the given identifier. Used as a gate in steps 3 and 4 of registration.
   */
  private async assertOtpWasVerified(
    identifier: string,
    type: OtpType,
  ): Promise<void> {
    // Check if a verified OTP exists for this identifier within the last 60 minutes.
    // Native SQL comparison (updated_at >= NOW() - INTERVAL '60 minutes') eliminates
    // any Node.js <-> PostgreSQL driver timezone parsing offset discrepancies.
    const verifiedOtp = await this.otpRepository
      .createQueryBuilder('otp')
      .where('otp.identifier = :identifier', { identifier })
      .andWhere('otp.type = :type', { type })
      .andWhere('otp.is_used = true')
      .andWhere("otp.updated_at >= NOW() - INTERVAL '60 minutes'")
      .orderBy('otp.updated_at', 'DESC')
      .getOne();

    if (!verifiedOtp) {
      throw new BadRequestException(
        'Your verification session has expired or contact verification was not found. Please verify your OTP again.',
      );
    }
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

  /**
   * Retrieves public details of a team invitation by token for invited user verification
   */
  async getInviteInfo(token: string): Promise<{
    email: string;
    role: StaffRole;
    agencyName: string;
    expiresAt: Date;
  }> {
    const cleanToken = (token || '').trim();
    const invite = await this.inviteRepository.findOne({
      where: { token: cleanToken },
      relations: { agency: true },
    });

    if (!invite) {
      throw new NotFoundException(
        'Invitation token not found. Please check that you copied the complete token.',
      );
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new BadRequestException(
        'This invitation has already been accepted and activated.',
      );
    }

    if (invite.status === InviteStatus.REVOKED) {
      throw new BadRequestException(
        'This invitation was revoked because a newer invitation was issued for this email.',
      );
    }

    if (
      invite.status === InviteStatus.EXPIRED ||
      new Date(invite.expiresAt) < new Date()
    ) {
      if (invite.status !== InviteStatus.EXPIRED) {
        invite.status = InviteStatus.EXPIRED;
        await this.inviteRepository.save(invite);
      }
      throw new BadRequestException(
        'This invitation token has expired. Please request a new invitation from your agency owner.',
      );
    }

    return {
      email: invite.email,
      role: invite.role,
      agencyName: invite.agency.name,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Completes invited member account creation and issues authentication tokens
   */
  async acceptInvite(dto: AcceptInviteDto) {
    const cleanToken = (dto.token || '').trim();
    const invite = await this.inviteRepository.findOne({
      where: { token: cleanToken },
      relations: { agency: true },
    });

    if (!invite) {
      throw new NotFoundException(
        'Invitation token not found. Please check that you copied the complete token.',
      );
    }

    if (invite.status === InviteStatus.ACCEPTED) {
      throw new BadRequestException(
        'This invitation has already been accepted and activated.',
      );
    }

    if (invite.status === InviteStatus.REVOKED) {
      throw new BadRequestException(
        'This invitation was revoked because a newer invitation was issued for this email.',
      );
    }

    if (
      invite.status === InviteStatus.EXPIRED ||
      new Date(invite.expiresAt) < new Date()
    ) {
      if (invite.status !== InviteStatus.EXPIRED) {
        invite.status = InviteStatus.EXPIRED;
        await this.inviteRepository.save(invite);
      }
      throw new BadRequestException(
        'This invitation token has expired. Please request a new invitation from your agency owner.',
      );
    }

    const cleanEmail = invite.email.toLowerCase().trim();

    // Verify user doesn't already exist for this agency
    const existingUser = await this.userRepository.findOne({
      where: { email: cleanEmail, agencyId: invite.agencyId },
    });
    if (existingUser) {
      throw new BadRequestException(
        'A team member with this email address already exists.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Create staff user
      const user = manager.create(User, {
        agencyId: invite.agencyId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: cleanEmail,
        passwordHash,
        role: invite.role,
        isEmailVerified: true,
        isPhoneVerified: false,
      });

      const savedUser = await manager.save(User, user);

      // Mark invite status as ACCEPTED
      invite.status = InviteStatus.ACCEPTED;
      await manager.save(UserInvite, invite);

      // Issue access and refresh tokens inside the active transaction
      const tokens = await this.tokenService.generateTokenPair(
        savedUser,
        undefined,
        manager,
      );

      return {
        message: 'Account setup completed successfully. Welcome to the team!',
        user: {
          id: savedUser.id,
          agencyId: savedUser.agencyId,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          email: savedUser.email,
          role: savedUser.role,
        },
        tokens,
      };
    });
  }
}
