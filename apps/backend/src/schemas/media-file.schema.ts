import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MediaFileDocument = MediaFile & Document;

@Schema({ timestamps: true, collection: 'media_files' })
export class MediaFile {
  @Prop({ required: true, unique: true })
  fileId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploaderId: Types.ObjectId;

  @Prop({ required: true })
  cloudinaryPublicId: string;

  @Prop()
  cloudinaryAssetId?: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  secureUrl: string;

  @Prop({ enum: ['image', 'video', 'raw', 'auto'], required: true })
  resourceType: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop()
  format?: string;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  duration?: number;

  @Prop({ enum: ['pending', 'uploaded', 'failed'], default: 'pending' })
  status: string;
}

export const MediaFileSchema = SchemaFactory.createForClass(MediaFile);
// fileId unique index is already created by @Prop({ unique: true }) above
MediaFileSchema.index({ uploaderId: 1 });
