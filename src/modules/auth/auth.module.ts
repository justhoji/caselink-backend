import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '@/modules/auth/entities/user.entity';
import { Otp } from '@/modules/auth/entities/otp.entity';
import { RefreshToken } from '@/modules/auth/entities/refresh-token.entity';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { AgencyPageSection } from '@/modules/agencies/entities/agency-page-section.entity';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { TokenService } from '@/modules/auth/services/token.service';
import { EmailModule } from '@/modules/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Otp,
      RefreshToken,
      Agency,
      AgencyPageSection,
    ]),
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_STAFF_SECRET',
          'super-secret-staff-key',
        ),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService],
  exports: [AuthService, JwtStrategy, TokenService],
})
export class AuthModule {}
