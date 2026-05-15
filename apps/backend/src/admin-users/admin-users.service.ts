import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';
import { ConversationMember, ConversationMemberDocument } from '../schemas/conversation-member.schema';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationMember.name) private readonly memberModel: Model<ConversationMemberDocument>,
  ) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);
    return { users, total, page, limit };
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateStatus(id: string, status: 'active' | 'suspended' | 'blocked') {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).select('-passwordHash');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getDashboardStats() {
    const [totalUsers, activeUsers, suspendedUsers] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ status: 'active' }),
      this.userModel.countDocuments({ status: 'suspended' }),
    ]);
    const [totalConversations, totalGroups] = await Promise.all([
      this.conversationModel.countDocuments(),
      this.conversationModel.countDocuments({ type: 'group' }),
    ]);
    return { totalUsers, activeUsers, suspendedUsers, totalConversations, totalGroups };
  }

  async getAdminGroupList(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [groups, total] = await Promise.all([
      this.conversationModel.find({ type: 'group' }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.conversationModel.countDocuments({ type: 'group' }),
    ]);
    return { groups, total, page, limit };
  }
}
