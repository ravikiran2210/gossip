import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from '../schemas/user.schema';
import { AccessCode, AccessCodeSchema } from '../schemas/access-code.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserJwtStrategy } from './user-jwt.strategy';
import { AccessCodesModule } from '../access-codes/access-codes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AccessCode.name, schema: AccessCodeSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m' },
      }),
      inject: [ConfigService],
    }),
    AccessCodesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
