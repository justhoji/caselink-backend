import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  agencyId: string;
  role: string;
  domain: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-staff') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_STAFF_SECRET', 'super-secret-staff-key'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || payload.domain !== 'staff') {
      throw new UnauthorizedException('Invalid token domain');
    }
    return {
      userId: payload.sub,
      agencyId: payload.agencyId,
      role: payload.role,
    };
  }
}
