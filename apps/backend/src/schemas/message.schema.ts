import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ required: true, unique: true })
  messageId: string; // UUID from client

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({
    enum: ['text', 'image', 'video', 'audio', 'file', 'gif', 'emoji', 'system'],
    required: true,
  })
  messageType: string;

  @Prop({ required: true })
  encryptedPayload: string; // Plaintext now; replace with real E2EE later

  @Prop({ type: Types.ObjectId, ref: 'MediaFile' })
  mediaId?: Types.ObjectId;

  @Prop()
  fileName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyToId?: Types.ObjectId;

  @Prop({
    type: [{ emoji: String, userId: { type: Types.ObjectId, ref: 'User' } }],
    default: [],
  })
  reactions: { emoji: string; userId: Types.ObjectId }[];

  @Prop({ default: false })
  deletedForEveryone: boolean;

  @Prop()
  deletedAt?: Date;

  // Per-user soft delete — stores IDs of users who deleted this message for themselves
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  deletedBy: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ messageId: 1 }, { unique: true });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ conversationId: 1, encryptedPayload: 'text' });
// Auto-delete messages older than 1 day to manage Atlas free-tier storage
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
