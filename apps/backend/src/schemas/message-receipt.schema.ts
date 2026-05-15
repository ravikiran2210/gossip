import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageReceiptDocument = MessageReceipt & Document;

@Schema({ collection: 'message_receipts' })
export class MessageReceipt {
  @Prop({ type: Types.ObjectId, ref: 'Message', required: true })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['delivered', 'read'], required: true })
  status: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MessageReceiptSchema = SchemaFactory.createForClass(MessageReceipt);
MessageReceiptSchema.index({ messageId: 1, userId: 1, status: 1 }, { unique: true });
MessageReceiptSchema.index({ messageId: 1 });
// Auto-delete receipts older than 1 day (receipts are useless after messages expire)
MessageReceiptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
