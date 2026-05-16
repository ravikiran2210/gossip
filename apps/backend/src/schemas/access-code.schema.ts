import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccessCodeDocument = AccessCode & Document;

@Schema({ timestamps: true, collection: 'access_codes' })
export class AccessCode {
  @Prop({ required: true, unique: true })
  codeHash: string;

  @Prop({ required: true })
  rawCode: string;

  @Prop({ type: Types.ObjectId, ref: 'AccessRequest' })
  requestId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', required: true })
  createdByAdminId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  // active  → generated, not yet used
  // bound   → permanently linked to a user; used for every future login
  // expired → passed initial verification window before first use
  // revoked → manually revoked by admin
  @Prop({ enum: ['active', 'bound', 'expired', 'revoked'], default: 'active' })
  status: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  boundAt?: Date; // when user completed profile setup
}

export const AccessCodeSchema = SchemaFactory.createForClass(AccessCode);
// codeHash unique index is already created by @Prop({ unique: true }) above
AccessCodeSchema.index({ status: 1, expiresAt: 1 });
