import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ enum: ['direct', 'group'], required: true })
  type: string;

  @Prop({ trim: true })
  title?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ sparse: true, unique: true })
  directKey?: string;

  @Prop({ type: Types.ObjectId, required: true })
  createdById: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  lastMessageId?: Types.ObjectId;

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  lastMessagePreview?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// directKey unique+sparse index is already created by @Prop({ sparse: true, unique: true }) above
ConversationSchema.index({ createdById: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
