import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema';
import { MessageReceipt, MessageReceiptDocument } from '../schemas/message-receipt.schema';
import { ConversationsService } from '../conversations/conversations.service';
import { ConversationMember, ConversationMemberDocument } from '../schemas/conversation-member.schema';

export interface SendMessageDto {
  messageId: string;
  conversationId: string;
  senderId: string;
  messageType: string;
  encryptedPayload: string;
  mediaId?: string;
  fileName?: string;
  replyToId?: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(MessageReceipt.name) private readonly receiptModel: Model<MessageReceiptDocument>,
    @InjectModel(ConversationMember.name) private readonly memberModel: Model<ConversationMemberDocument>,
    private readonly conversationsService: ConversationsService,
  ) {}

  async send(dto: SendMessageDto) {
    const isMember = await this.conversationsService.isActiveMember(dto.conversationId, dto.senderId);
    if (!isMember) throw new ForbiddenException('Not an active member of this conversation');

    const existing = await this.messageModel.findOne({ messageId: dto.messageId });
    if (existing) return existing;

    const message = await this.messageModel.create({
      messageId: dto.messageId,
      conversationId: new Types.ObjectId(dto.conversationId),
      senderId: new Types.ObjectId(dto.senderId),
      messageType: dto.messageType,
      encryptedPayload: dto.encryptedPayload,
      mediaId: dto.mediaId ? new Types.ObjectId(dto.mediaId) : undefined,
      fileName: dto.fileName,
      replyToId: dto.replyToId ? new Types.ObjectId(dto.replyToId) : undefined,
    });

    const preview = dto.messageType === 'text'
      ? dto.encryptedPayload.substring(0, 80)
      : dto.messageType === 'image' ? '📷 Photo'
      : dto.messageType === 'video' ? '🎥 Video'
      : dto.messageType === 'audio' ? '🎵 Audio'
      : dto.messageType === 'gif' ? '🎞 GIF'
      : `📎 ${dto.fileName || 'File'}`;

    await this.conversationsService.updateLastMessage(
      dto.conversationId,
      message._id.toString(),
      message['createdAt'] || new Date(),
      preview,
    );

    // Increment unread count for all members except sender
    await this.memberModel.updateMany(
      {
        conversationId: new Types.ObjectId(dto.conversationId),
        userId: { $ne: new Types.ObjectId(dto.senderId) },
        status: 'active',
      },
      { $inc: { unreadCount: 1 } },
    );

    return message;
  }

  async getMessages(conversationId: string, userId: string, limit = 50, before?: string) {
    const isMember = await this.conversationsService.isActiveMember(conversationId, userId);
    if (!isMember) throw new ForbiddenException('Not a member');

    const filter: any = {
      conversationId: new Types.ObjectId(conversationId),
      deletedForEveryone: { $ne: true },
      // Hide messages deleted for everyone OR deleted by this specific user (per-user soft delete)
      deletedBy: { $nin: [new Types.ObjectId(userId)] },
      // Backward-compat: hide messages with legacy deletedAt (set before deletedBy was added)
      deletedAt: null,
    };
    if (before) {
      const msg = await this.messageModel.findOne({ messageId: before });
      if (msg) filter.createdAt = { $lt: msg['createdAt'] };
    }

    return this.messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('replyToId', 'encryptedPayload senderId messageType fileName')
      .lean();
  }

  async searchMessages(conversationId: string, userId: string, query: string) {
    const isMember = await this.conversationsService.isActiveMember(conversationId, userId);
    if (!isMember) throw new ForbiddenException('Not a member');
    if (!query?.trim()) return [];

    return this.messageModel
      .find({
        conversationId: new Types.ObjectId(conversationId),
        deletedForEveryone: { $ne: true },
        deletedBy: { $nin: [new Types.ObjectId(userId)] },
        deletedAt: null,
        $text: { $search: query.trim() },
      })
      .sort({ score: { $meta: 'textScore' } })
      .limit(30)
      .lean();
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    const existing = message.reactions.find(
      (r) => r.userId.toString() === userId && r.emoji === emoji,
    );

    if (existing) {
      await this.messageModel.updateOne(
        { _id: messageId },
        { $pull: { reactions: { userId: new Types.ObjectId(userId), emoji } } as any },
      );
    } else {
      await this.messageModel.updateOne(
        { _id: messageId },
        { $push: { reactions: { emoji, userId: new Types.ObjectId(userId) } } as any },
      );
    }

    const updated = await this.messageModel.findById(messageId).lean();
    // Guard against race condition where message was deleted between update and re-fetch
    if (!updated) throw new NotFoundException('Message not found');
    return updated.reactions;
  }

  async deleteForMe(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    // Verify user is a member of the conversation
    const isMember = await this.conversationsService.isActiveMember(
      message.conversationId.toString(),
      userId,
    );
    if (!isMember) throw new ForbiddenException('Not a member of this conversation');

    // Per-user soft delete — only hides the message for this user, not for others
    await this.messageModel.updateOne(
      { _id: messageId },
      { $addToSet: { deletedBy: new Types.ObjectId(userId) } },
    );
    return { deleted: true };
  }

  async deleteForEveryone(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('Only the sender can delete for everyone');
    }
    message.deletedForEveryone = true;
    message.encryptedPayload = '';
    await message.save();
    return { deleted: true, messageId };
  }

  async markDelivered(messageId: string, userId: string) {
    // Use $set so Mongoose sends an operator update (not a full document replacement)
    await this.receiptModel.findOneAndUpdate(
      { messageId: new Types.ObjectId(messageId), userId: new Types.ObjectId(userId), status: 'delivered' },
      { $set: { status: 'delivered' } },
      { upsert: true },
    );
  }

  async markRead(messageId: string, userId: string) {
    // Use $set so Mongoose sends an operator update (not a full document replacement)
    await this.receiptModel.findOneAndUpdate(
      { messageId: new Types.ObjectId(messageId), userId: new Types.ObjectId(userId), status: 'read' },
      { $set: { status: 'read' } },
      { upsert: true },
    );
  }

  async markConversationRead(conversationId: string, userId: string) {
    await this.memberModel.updateOne(
      { conversationId: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) },
      { $set: { unreadCount: 0, lastReadAt: new Date() } },
    );
  }

  async getConversationReceivers(conversationId: string, excludeUserId: string): Promise<string[]> {
    const members = await this.memberModel.find({
      conversationId: new Types.ObjectId(conversationId),
      status: 'active',
      userId: { $ne: new Types.ObjectId(excludeUserId) },
    }).lean();
    return members.map((m) => m.userId.toString());
  }
}
