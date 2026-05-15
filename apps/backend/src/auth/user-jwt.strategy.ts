import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any): Promise<Record<string, any>> {
    if (payload.type !== 'user') throw new UnauthorizedException();
    const user = await this.authService.validateUser(payload.sub);
    if (!user) throw new UnauthorizedException();
    if (user.status !== 'active') throw new UnauthorizedException('Account is not active');
    return { ...user, sub: payload.sub };
  }
}
