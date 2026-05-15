import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConversationMember, ConversationMemberDocument } from '../schemas/conversation-member.schema';
import { Conversation, ConversationDocument } from '../schemas/conversation.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(ConversationMember.name) private readonly memberModel: Model<ConversationMemberDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  private async requireGroupAdminOrOwner(conversationId: string, userId: string) {
    const member = await this.memberModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      status: 'active',
      role: { $in: ['owner', 'admin'] },
    });
    if (!member) throw new ForbiddenException('Only group admin or owner can perform this action');
    return member;
  }

  async addMembers(conversationId: string, requesterId: string, userIds: string[]) {
    await this.requireGroupAdminOrOwner(conversationId, requesterId);
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation || conversation.type !== 'group') throw new NotFoundException('Group not found');

    const addedMembers: any[] = [];
    for (const uid of userIds) {
      const existing = await this.memberModel.findOne({
        conversationId: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(uid),
      });
      if (existing) {
        if (existing.status !== 'active') {
          existing.status = 'active';
          existing.joinedAt = new Date();
          await existing.save();
          addedMembers.push(existing);
        }
      } else {
        const m = await this.memberModel.create({
          conversationId: new Types.ObjectId(conversationId),
          userId: new Types.ObjectId(uid),
          role: 'member',
          status: 'active',
          joinedAt: new Date(),
        });
        addedMembers.push(m);
      }
    }
    return addedMembers;
  }

  async removeMember(conversationId: string, requesterId: string, targetUserId: string) {
    await this.requireGroupAdminOrOwner(conversationId, requesterId);

    const target = await this.memberModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(targetUserId),
      status: 'active',
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') throw new ForbiddenException('Cannot remove group owner');

    target.status = 'removed';
    target.removedAt = new Date();
    await target.save();
    return target;
  }

  async leaveGroup(conversationId: string, userId: string) {
    const member = await this.memberModel.findOne({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!member) throw new NotFoundException('You are not a member of this group');

    if (member.role === 'owner') {
      throw new ForbiddenException('Transfer ownership before leaving the group.');
    }

    member.status = 'left';
    member.leftAt = new Date();
    await member.save();
    return { left: true };
  }

  async updateMemberRole(conversationId: string, requesterId: string, targetUserId: string, role: 'admin' | 'member') {
    await this.requireGroupAdminOrOwner(conversationId, requesterId);

    const target = await this.memberModel.findOneAndUpdate(
      {
        conversationId: new Types.ObjectId(conversationId),
        userId: new Types.ObjectId(targetUserId),
        status: 'active',
      },
      { role },
      { new: true },
    );
    if (!target) throw new NotFoundException('Member not found');
    return target;
  }
}
