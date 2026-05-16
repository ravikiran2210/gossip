import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminUserDocument = AdminUser & Document;

@Schema({ timestamps: true, collection: 'admin_users' })
export class AdminUser {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ enum: ['super_admin', 'admin'], default: 'admin' })
  role: string;

  @Prop({ enum: ['active', 'disabled'], default: 'active' })
  status: string;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);
// email and username unique indexes are already created by @Prop({ unique: true }) above
