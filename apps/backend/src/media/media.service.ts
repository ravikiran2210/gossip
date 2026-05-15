import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { MediaFile, MediaFileDocument } from '../schemas/media-file.schema';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectModel(MediaFile.name) private readonly mediaFileModel: Model<MediaFileDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly config: ConfigService,
  ) {}

  private getResourceType(mimeType: string): 'image' | 'video' | 'raw' | 'auto' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }

  private validateFile(mimeType: string, sizeBytes: number) {
    const mb = sizeBytes / (1024 * 1024);
    const allowedImages = this.config.get<string[]>('media.allowedImageTypes') || [];
    const allowedVideos = this.config.get<string[]>('media.allowedVideoTypes') || [];
    const allowedAudios = this.config.get<string[]>('media.allowedAudioTypes') || [];
    const allowedDocs = this.config.get<string[]>('media.allowedDocumentTypes') || [];

    if (allowedImages.includes(mimeType)) {
      const max = this.config.get<number>('media.maxImageSizeMb') || 10;
      if (mb > max) throw new BadRequestException(`Image too large (max ${max}MB)`);
      return;
    }
    if (allowedVideos.includes(mimeType)) {
      const max = this.config.get<number>('media.maxVideoSizeMb') || 100;
      if (mb > max) throw new BadRequestException(`Video too large (max ${max}MB)`);
      return;
    }
    if (allowedAudios.includes(mimeType)) {
      const max = this.config.get<number>('media.maxAudioSizeMb') || 20;
      if (mb > max) throw new BadRequestException(`Audio too large (max ${max}MB)`);
      return;
    }
    if (allowedDocs.includes(mimeType)) {
      const max = this.config.get<number>('media.maxFileSizeMb') || 50;
      if (mb > max) throw new BadRequestException(`File too large (max ${max}MB)`);
      return;
    }
    throw new BadRequestException(`File type ${mimeType} is not allowed`);
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string, fileSize: number, uploaderId: string) {
    this.validateFile(mimeType, fileSize);

    const resourceType = this.getResourceType(mimeType);
    const fileId = uuidv4();

    // Upload to Cloudinary first, then persist to DB once we have real URLs
    let result: any;
    try {
      result = await this.cloudinaryService.uploadBuffer(buffer, originalName, resourceType);
    } catch (err) {
      this.logger.error('Cloudinary upload failed', err);
      throw new BadRequestException('Media upload failed');
    }

    const mediaFile = await this.mediaFileModel.create({
      fileId,
      uploaderId: new Types.ObjectId(uploaderId),
      cloudinaryPublicId: result.public_id,
      cloudinaryAssetId: result.asset_id,
      url: result.url,
      secureUrl: result.secure_url,
      resourceType,
      originalName,
      mimeType,
      fileSize,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      status: 'uploaded',
    });

    return { ...mediaFile.toObject(), fileId };
  }

  async findByFileId(fileId: string) {
    return this.mediaFileModel.findOne({ fileId }).lean();
  }
}
