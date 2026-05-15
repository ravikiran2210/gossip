import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccessRequestDocument = AccessRequest & Document;

@Schema({ timestamps: true, collection: 'access_requests' })
export class AccessRequest {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  message?: string;

  @Prop({ enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
  reviewedByAdminId?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;
}

export const AccessRequestSchema = SchemaFactory.createForClass(AccessRequest);
AccessRequestSchema.index({ email: 1 });
AccessRequestSchema.index({ status: 1 });
