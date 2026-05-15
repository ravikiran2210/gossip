import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AdminUser, AdminUserDocument } from '../schemas/admin-user.schema';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(emailOrUsername: string, password: string) {
    const admin = await this.adminUserModel.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername.toLowerCase() },
      ],
    });

    if (!admin) throw new UnauthorizedException('Invalid credentials');
    if (admin.status !== 'active')
      throw new UnauthorizedException('Account is disabled');

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      type: 'admin',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        username: admin.username,
        role: admin.role,
      },
    };
  }

  async validateAdmin(adminId: string) {
    return this.adminUserModel.findById(adminId).select('-passwordHash').lean();
  }

  async getMe(adminId: string) {
    const admin = await this.adminUserModel
      .findById(adminId)
      .select('-passwordHash')
      .lean();
    if (!admin) throw new UnauthorizedException();
    return admin;
  }
}
