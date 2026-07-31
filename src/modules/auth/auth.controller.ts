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

@Controller('auth/staff')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * STEP 1: Input email/phone and request verification OTP
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/send-otp')
  registerSendOtp(@Body() dto: RegisterSendOtpDto) {
    return this.authService.registerSendOtp(dto);
  }

  /**
   * STEP 2: Verify 6-digit OTP code received
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/verify-otp')
  registerVerifyOtp(@Body() dto: RegisterVerifyOtpDto) {
    return this.authService.registerVerifyOtp(dto);
  }

  /**
   * STEP 3: Set Password Phase
   */
  @HttpCode(HttpStatus.OK)
  @Post('register/set-password')
  registerSetPassword(@Body() dto: RegisterSetPasswordDto) {
    return this.authService.registerSetPassword(dto);
  }

  /**
   * STEP 4 Helper: Check if page address slug is available (e.g. "mytours.caselink.uz")
   */
  @Get('register/check-slug/:slug')
  checkSlugAvailability(@Param('slug') slug: string) {
    return this.authService.checkSlugAvailability(slug);
  }

  /**
   * STEP 4 / FINAL: Set agency name, unique page address & complete setup
   */
  @Post('register/complete')
  registerComplete(@Body() dto: RegisterCompleteDto) {
    return this.authService.registerComplete(dto);
  }

  /**
   * Single-step Registration Wrapper
   */
  @Post('register')
  registerOwner(@Body() dto: RegisterOwnerDto) {
    return this.authService.registerOwner(dto);
  }

  // ==========================================
  // AUTHENTICATION & LOGIN FLOWS
  // ==========================================

  @HttpCode(HttpStatus.OK)
  @Post('login/password')
  loginWithPassword(@Body() dto: LoginPasswordDto) {
    return this.authService.loginWithPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login/otp')
  loginWithOtp(@Body() dto: LoginOtpDto) {
    return this.authService.loginWithOtp(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.identifier);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Request() req: any) {
    return this.authService.logout(req.user.userId);
  }
}
