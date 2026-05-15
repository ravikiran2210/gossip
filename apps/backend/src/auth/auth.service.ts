import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';
import { AccessCodesService } from '../access-codes/access-codes.service';
import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class VerifyCodeDto {
  @IsString() code: string;
}

export class SetupProfileDto {
  @IsString() codeId: string;
  @IsString() name: string;
  @IsString() @MinLength(3) @MaxLength(30) username: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsString() avatarUrl?: string;
}

export class UserLoginDto {
  @IsString() emailOrUsername: string;
  @IsString() password: string;
}

export class RefreshTokenDto {
  @IsString() refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly accessCodesService: AccessCodesService,
    private readonly config: ConfigService,
  ) {}

  private generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, type: 'user' });
    const refreshToken = this.jwtService.sign(
      { sub: userId, email, type: 'user-refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d',
      },
    );
    return { accessToken, refreshToken };
  }

  /**
   * Verify an access code.
   *
   * Two outcomes:
   *  1. Code is "active"  → new user, needs profile setup.
   *     Returns { isNewUser: true, codeId }
   *
   *  2. Code is "bound"   → returning user, already has an account.
   *     Returns { isNewUser: false, accessToken, user }
   *     (logs them in directly — no setup needed)
   */
  async verifyCode(rawCode: string) {
    const { code, isReturningUser } = await this.accessCodesService.verify(rawCode);

    if (isReturningUser) {
      // Returning user — code is permanently bound to their account
      if (!code.userId) {
        throw new BadRequestException('Access code is not linked to any user');
      }
      const user = await this.userModel
        .findById(code.userId)
        .select('-passwordHash')
        .lean();

      if (!user) throw new UnauthorizedException('User account not found');
      if (user.status !== 'active') throw new UnauthorizedException('Account is suspended');

      const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), user.email);
      return { isNewUser: false, accessToken, refreshToken, user };
    }

    // New user — send them to profile setup
    return { isNewUser: true, codeId: code._id.toString() };
  }

  async setupProfile(dto: SetupProfileDto) {
    // Confirm the code is still in "active" state (not yet bound)
    const activeCode = await this.accessCodesService.findActiveById(dto.codeId);
    if (!activeCode) {
      throw new BadRequestException('Access code is invalid, expired, or already used');
    }

    const emailTaken = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (emailTaken) throw new ConflictException('Email already in use');

    const usernameTaken = await this.userModel.findOne({ username: dto.username.toLowerCase() });
    if (usernameTaken) throw new ConflictException('Username already taken');

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const user = await this.userModel.create({
      name: dto.name,
      username: dto.username.toLowerCase(),
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
      passwordHash,
      status: 'active',
    });

    // Bind the code permanently to this user — becomes their login key forever
    await this.accessCodesService.markBound(dto.codeId, user._id.toString());

    const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), user.email);
    return { user: this.safeUser(user), accessToken, refreshToken };
  }

  async login(emailOrUsername: string, password: string) {
    const user = await this.userModel.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== 'active') throw new UnauthorizedException('Account is not active');
    if (!user.passwordHash) throw new BadRequestException('Password login not enabled for this account');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), user.email);
    return { user: this.safeUser(user), accessToken, refreshToken };
  }

  async refreshTokens(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'user-refresh') throw new UnauthorizedException('Invalid token type');

      const user = await this.userModel.findById(payload.sub).select('-passwordHash').lean();
      if (!user) throw new UnauthorizedException('User not found');
      if (user.status !== 'active') throw new UnauthorizedException('Account is not active');

      return this.generateTokens(user._id.toString(), user.email);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(userId: string) {
    return this.userModel.findById(userId).select('-passwordHash').lean();
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').lean();
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private safeUser(user: UserDocument) {
    const u = user.toObject();
    delete u.passwordHash;
    return u;
  }
}
