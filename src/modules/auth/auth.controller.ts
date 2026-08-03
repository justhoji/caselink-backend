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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterOwnerDto } from '@/modules/auth/dto/register-owner.dto';
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

@ApiTags('Auth')
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
  })
  registerSendOtp(@Body() dto: RegisterSendOtpDto) {
    return this.authService.registerSendOtp(dto);
  }

  /**
   * STEP 2: Verify 6-digit OTP code received
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/verify-otp')
  @ApiOperation({ summary: 'Step 2 — Verify the 6-digit registration OTP' })
  registerVerifyOtp(@Body() dto: RegisterVerifyOtpDto) {
    return this.authService.registerVerifyOtp(dto);
  }

  /**
   * STEP 3: Set Password Phase
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/set-password')
  @ApiOperation({
    summary: 'Step 3 — Pre-validate password (requires prior OTP verification)',
  })
  registerSetPassword(@Body() dto: RegisterSetPasswordDto) {
    return this.authService.registerSetPassword(dto);
  }

  /**
   * STEP 4 Helper: Check if page address slug is available (e.g. "mytours.caselink.uz")
   */
  @Get('register/check-slug/:slug')
  @ApiOperation({
    summary: 'Step 4 helper — Check if a page address slug is available',
  })
  checkSlugAvailability(@Param('slug') slug: string) {
    return this.authService.checkSlugAvailability(slug);
  }

  /**
   * STEP 4 / FINAL: Set agency name, unique page address & complete setup
   */
  @Post('register/complete')
  @ApiOperation({
    summary: 'Step 4 — Complete registration: create agency + owner user',
  })
  registerComplete(@Body() dto: RegisterCompleteDto) {
    return this.authService.registerComplete(dto);
  }

  /**
   * Single-step Registration Wrapper
   */
  @Post('register')
  @ApiOperation({
    summary: 'Single-step registration (legacy / simplified flow)',
  })
  registerOwner(@Body() dto: RegisterOwnerDto) {
    return this.authService.registerOwner(dto);
  }

  // ==========================================
  // AUTHENTICATION & LOGIN FLOWS
  // ==========================================

  @HttpCode(HttpStatus.OK)
  @Post('login/password')
  @ApiOperation({ summary: 'Log in with email/phone and password' })
  loginWithPassword(@Body() dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('otp/send')
  @ApiOperation({ summary: 'Send a login or forgot-password OTP' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/otp')
  @ApiOperation({ summary: 'Log in with a one-time OTP code' })
  loginWithOtp(@Body() dto: LoginOtpDto) {
    return this.authService.loginWithOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a forgot-password OTP' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.identifier);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a verified OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and get a new token pair' })
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  logout(@Request() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.userId);
  }
}
