import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs' })
export class AuditLog {
  @Prop({ enum: ['admin', 'user', 'system'], required: true })
  actorType: string;

  @Prop({ type: Types.ObjectId })
  actorId?: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop()
  targetType?: string;

  @Prop({ type: Types.ObjectId })
  targetId?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ actorId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });
// Auto-delete audit logs older than 1 day
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
