import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { Throttle } from '@nestjs/throttler';

class AdminLoginDto {
  @IsString()
  @IsNotEmpty()
  emailOrUsername: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto.emailOrUsername, dto.password);
  }

  @Post('logout')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  logout() {
    // Stateless JWT — client discards token
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(AdminJwtGuard)
  getMe(@CurrentAdmin('sub') adminId: string) {
    return this.adminAuthService.getMe(adminId);
  }
}
