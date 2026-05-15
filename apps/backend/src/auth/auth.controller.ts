import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService, VerifyCodeDto, SetupProfileDto, UserLoginDto, RefreshTokenDto } from './auth.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('access/verify-code')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.code);
  }

  @Post('access/setup-profile')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  setupProfile(@Body() dto: SetupProfileDto) {
    return this.authService.setupProfile(dto);
  }

  @Post('auth/login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: UserLoginDto) {
    return this.authService.login(dto.emailOrUsername, dto.password);
  }

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('auth/logout')
  @UseGuards(UserJwtGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    return { message: 'Logged out' };
  }

  @Get('users/me')
  @UseGuards(UserJwtGuard)
  getMe(@CurrentUser('sub') userId: string) {
    return this.authService.getMe(userId);
  }
}
