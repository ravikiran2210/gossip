import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { ConversationMember, ConversationMemberDocument } from '../schemas/conversation-member.schema';

@Injectable()
export class SyncService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(ConversationMember.name) private readonly memberModel: Model<ConversationMemberDocument>,
  ) {}

  async getMissedMessages(userId: string, since: string) {
    const sinceDate = new Date(since);
    const memberships = await this.memberModel.find({
      userId: new Types.ObjectId(userId),
      status: 'active',
    }).lean();
    const conversationIds = memberships.map((m) => m.conversationId);

    return this.messageModel.find({
      conversationId: { $in: conversationIds },
      createdAt: { $gt: sinceDate },
      deletedAt: null,
    }).sort({ createdAt: 1 }).limit(500).lean();
  }
}
