import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ trim: true, maxlength: 300 })
  bio?: string;

  @Prop()
  passwordHash?: string;

  @Prop({ enum: ['active', 'suspended', 'blocked'], default: 'active' })
  status: string;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastSeenAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
// email and username unique indexes are already created by @Prop({ unique: true }) above
UserSchema.index({ status: 1 });
