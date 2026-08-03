import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterSendOtpDto } from '@/modules/auth/dto/register-send-otp.dto';
import { RegisterVerifyOtpDto } from '@/modules/auth/dto/register-verify-otp.dto';
import { RegisterSetPasswordDto } from '@/modules/auth/dto/register-set-password.dto';
import { RegisterCompleteDto } from '@/modules/auth/dto/register-complete.dto';
import { LoginPasswordDto } from '@/modules/auth/dto/login-password.dto';
import { SendOtpDto } from '@/modules/auth/dto/send-otp.dto';
import { LoginOtpDto } from '@/modules/auth/dto/login-otp.dto';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { RefreshTokenDto } from '@/modules/auth/dto/refresh-token.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
    agencyId?: string;
  };
}

@ApiTags('Auth — Staff Onboarding & Authentication')
@Controller('auth/staff')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * STEP 1: Input email/phone and request verification OTP
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/send-otp')
  @ApiOperation({
    summary: 'Step 1 — Send a registration OTP to email or phone',
    description:
      'Dispatches a 6-digit OTP code to verify ownership of email/phone before onboarding.',
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict — Email or phone is already registered.',
  })
  registerSendOtp(@Body() dto: RegisterSendOtpDto) {
    return this.authService.registerSendOtp(dto);
  }

  /**
   * STEP 2: Verify 6-digit OTP code received
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/verify-otp')
  @ApiOperation({
    summary: 'Step 2 — Verify the 6-digit registration OTP',
    description: 'Verifies the OTP code sent in Step 1.',
  })
  @ApiResponse({ status: 200, description: 'Contact verified successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid or expired OTP code.',
  })
  registerVerifyOtp(@Body() dto: RegisterVerifyOtpDto) {
    return this.authService.registerVerifyOtp(dto);
  }

  /**
   * STEP 3: Set Password Phase
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/set-password')
  @ApiOperation({
    summary: 'Step 3 — Set password phase',
    description:
      'Pre-validates user password after successful contact verification.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password accepted for onboarding.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — OTP verification required first.',
  })
  registerSetPassword(@Body() dto: RegisterSetPasswordDto) {
    return this.authService.registerSetPassword(dto);
  }

  /**
   * STEP 4 Helper: Check if page address slug is available (e.g. "mytours.caselink.uz")
   */
  @Get('register/check-slug/:slug')
  @ApiOperation({
    summary: 'Step 4 Helper — Check if a page address slug is available',
    description:
      'Instantly checks if a desired agency page address (e.g. "silkroad.caselink.uz") is available.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns availability boolean and formatted full domain.',
  })
  checkSlugAvailability(@Param('slug') slug: string) {
    return this.authService.checkSlugAvailability(slug);
  }

  /**
   * STEP 4 / FINAL: Set agency name, unique page address & complete setup
   */
  @Post('register/complete')
  @ApiOperation({
    summary: 'Step 4 — Complete agency setup and onboarding',
    description:
      'Creates the new Agency record and Owner User, issuing initial JWT access and refresh token pair.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Agency & Owner user created successfully. Returns user, agency, and JWT tokens.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing fields or unverified session.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict — Page address slug is already taken.',
  })
  registerComplete(@Body() dto: RegisterCompleteDto) {
    return this.authService.registerComplete(dto);
  }

  // ==========================================
  // AUTHENTICATION & LOGIN FLOWS
  // ==========================================

  @HttpCode(HttpStatus.OK)
  @Post('login/password')
  @ApiOperation({
    summary: 'Log in with password',
    description: 'Authenticates a staff member using email/phone and password.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. Returns user details + access/refresh tokens.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Invalid credentials or account lockout.',
  })
  loginWithPassword(@Body() dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('otp/send')
  @ApiOperation({
    summary: 'Send an OTP for passwordless login or forgot-password',
    description:
      'Dispatches a 6-digit OTP code for passwordless sign-in or password reset.',
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/otp')
  @ApiOperation({
    summary: 'Log in with a one-time OTP code',
    description:
      'Authenticates a staff member passwordlessly using a 6-digit OTP code.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns user details + tokens.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Invalid or expired OTP code.',
  })
  loginWithOtp(@Body() dto: LoginOtpDto) {
    return this.authService.loginWithOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request a password reset OTP',
    description: 'Sends a 6-digit FORGOT_PASSWORD OTP to the user email/phone.',
  })
  @ApiResponse({
    status: 200,
    description: 'If account exists, an OTP email has been sent.',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.identifier);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password using verified OTP code',
    description:
      'Resets account password and clears failed login attempts / lockouts upon OTP verification.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid or expired OTP code.',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Rotate refresh token and issue new token pair',
    description:
      'Exchanges a valid refresh token for a fresh access token and new refresh token (Refresh Token Rotation).',
  })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Invalid, revoked, or expired refresh token.',
  })
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({
    summary: 'Log out current user',
    description:
      'Revokes all active refresh tokens for the authenticated staff user.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  logout(@Request() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.userId);
  }
}
