import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationMemberDocument = ConversationMember & Document;

@Schema({ timestamps: true, collection: 'conversation_members' })
export class ConversationMember {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['owner', 'admin', 'member'], default: 'member' })
  role: string;

  @Prop({ enum: ['active', 'left', 'removed'], default: 'active' })
  status: string;

  @Prop({ default: Date.now })
  joinedAt: Date;

  @Prop()
  leftAt?: Date;

  @Prop()
  removedAt?: Date;

  @Prop({ type: Types.ObjectId })
  lastReadMessageId?: Types.ObjectId;

  @Prop()
  lastReadAt?: Date;

  @Prop({ default: 0 })
  unreadCount: number;

  @Prop()
  pinnedAt?: Date;
}

export const ConversationMemberSchema = SchemaFactory.createForClass(ConversationMember);
ConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
ConversationMemberSchema.index({ userId: 1, status: 1 });
