import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { User, UserDocument } from '../schemas/user.schema';

export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  @IsOptional() @IsString() avatarUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async search(query: string, limit = 20) {
    if (!query || query.trim().length < 2) return [];
    const regex = new RegExp(query.trim(), 'i');
    return this.userModel
      .find({ status: 'active', $or: [{ name: regex }, { username: regex }] })
      .select('_id name username avatarUrl bio isOnline lastSeenAt')
      .limit(limit)
      .lean();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const update: any = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.bio !== undefined) update.bio = dto.bio;
    if (dto.avatarUrl !== undefined) update.avatarUrl = dto.avatarUrl;

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('-passwordHash')
      .lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setOnlineStatus(userId: string, isOnline: boolean) {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        isOnline,
        ...(!isOnline ? { lastSeenAt: new Date() } : {}),
      },
    });
  }

  async getStatus(userId: string) {
    const user = await this.userModel.findById(userId).select('isOnline lastSeenAt').lean();
    if (!user) throw new NotFoundException('User not found');
    return { isOnline: user.isOnline, lastSeenAt: user.lastSeenAt };
  }
}
