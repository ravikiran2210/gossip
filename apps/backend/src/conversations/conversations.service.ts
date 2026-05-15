import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';
import { ConversationMember, ConversationMemberDocument } from '../schemas/conversation-member.schema';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateDirectDto {
  @IsString() targetUserId: string;
}

export class CreateGroupDto {
  @IsString() title: string;
  @IsArray() memberIds: string[];
  @IsOptional() @IsString() avatarUrl?: string;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationMember.name) private readonly memberModel: Model<ConversationMemberDocument>,
  ) {}

  async createDirect(userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new BadRequestException('Cannot create chat with yourself');

    const sorted = [userId, targetUserId].sort();
    const directKey = sorted.join(':');

    const existing = await this.conversationModel.findOne({ directKey });
    if (existing) {
      // Ensure both users are active members (could have been removed)
      await this.memberModel.updateMany(
        { conversationId: existing._id, userId: { $in: [new Types.ObjectId(userId), new Types.ObjectId(targetUserId)] } },
        { $set: { status: 'active' } },
      );
      return existing;
    }

    const conversation = await this.conversationModel.create({
      type: 'direct',
      directKey,
      createdById: new Types.ObjectId(userId),
    });

    await this.memberModel.insertMany([
      { conversationId: conversation._id, userId: new Types.ObjectId(userId), role: 'member', status: 'active', joinedAt: new Date() },
      { conversationId: conversation._id, userId: new Types.ObjectId(targetUserId), role: 'member', status: 'active', joinedAt: new Date() },
    ]);

    return conversation;
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    if (!dto.title?.trim()) throw new BadRequestException('Group title is required');

    const conversation = await this.conversationModel.create({
      type: 'group',
      title: dto.title.trim(),
      avatarUrl: dto.avatarUrl,
      createdById: new Types.ObjectId(userId),
    });

    const memberIds = [...new Set([userId, ...dto.memberIds])];
    await this.memberModel.insertMany(
      memberIds.map((mid) => ({
        conversationId: conversation._id,
        userId: new Types.ObjectId(mid),
        role: mid === userId ? 'owner' : 'member',
        status: 'active',
        joinedAt: new Date(),
      })),
    );

    return conversation;
  }

  async getUserConversations(userId: string): Promise<Record<string, any>[]> {
    const memberships = await this.memberModel
      .find({ userId: new Types.ObjectId(userId), status: 'active' })
      .lean();

    // Build per-user metadata map (unread, pinned)
    const memberMeta: Record<string, { unreadCount: number; pinnedAt: Date | null }> = {};
    for (const m of memberships) {
      memberMeta[m.conversationId.toString()] = {
        unreadCount: (m as any).unreadCount || 0,
        pinnedAt: (m as any).pinnedAt || null,
      };
    }

    const conversationIds = memberships.map((m) => m.conversationId);
    const conversations = await this.conversationModel
      .find({ _id: { $in: conversationIds } })
      .sort({ lastMessageAt: -1 })
      .lean();

    // Fetch all members for these conversations, populated with user info
    const allMembers = await this.memberModel
      .find({ conversationId: { $in: conversationIds }, status: 'active' })
      .populate('userId', 'name username avatarUrl')
      .lean();

    // Group members by conversationId string
    const membersByConv: Record<string, typeof allMembers> = {};
    for (const m of allMembers) {
      const key = m.conversationId.toString();
      if (!membersByConv[key]) membersByConv[key] = [];
      membersByConv[key].push(m);
    }

    return conversations.map((conv) => {
      const convKey = (conv._id as any).toString();
      const members = membersByConv[convKey] ?? [];

      // For direct chats, attach the other user's info directly so the
      // frontend doesn't need to parse the members array
      let otherUser: any = null;
      if (conv.type === 'direct') {
        const other = members.find(
          (m) => (m.userId as any)?._id?.toString() !== userId,
        );
        if (other) otherUser = other.userId;
      }

      const meta = memberMeta[convKey] || { unreadCount: 0, pinnedAt: null };
      return { ...conv, members, otherUser, unreadCount: meta.unreadCount, pinnedAt: meta.pinnedAt };
    }).sort((a, b) => {
      // Pinned conversations first
      if (a.pinnedAt && !b.pinnedAt) return -1;
      if (!a.pinnedAt && b.pinnedAt) return 1;
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });
  }

  async getById(conversationId: string, userId: string): Promise<Record<string, any>> {
    const conversation = await this.conversationModel.findById(conversationId).lean();
    if (!conversation) throw new NotFoundException('Conversation not found');

    const membership = await this.memberModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!membership) throw new ForbiddenException('Not a member of this conversation');

    const members = await this.memberModel
      .find({ conversationId: new Types.ObjectId(conversationId), status: 'active' })
      .populate('userId', 'name username avatarUrl')
      .lean();

    let otherUser: any = null;
    if (conversation.type === 'direct') {
      const other = members.find(
        (m) => (m.userId as any)?._id?.toString() !== userId,
      );
      if (other) otherUser = other.userId;
    }

    return { ...conversation, members, otherUser };
  }

  async isActiveMember(conversationId: string, userId: string): Promise<boolean> {
    const member = await this.memberModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    return !!member;
  }

  async updateLastMessage(conversationId: string, messageId: string, timestamp: Date, preview?: string) {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      lastMessageId: new Types.ObjectId(messageId),
      lastMessageAt: timestamp,
      ...(preview !== undefined ? { lastMessagePreview: preview } : {}),
    });
  }

  async pinConversation(conversationId: string, userId: string, pin: boolean) {
    await this.memberModel.updateOne(
      { conversationId: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) },
      { $set: { pinnedAt: pin ? new Date() : null } },
    );
    return { pinned: pin };
  }

  async markRead(conversationId: string, userId: string) {
    await this.memberModel.updateOne(
      { conversationId: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) },
      { $set: { unreadCount: 0, lastReadAt: new Date() } },
    );
  }
}
