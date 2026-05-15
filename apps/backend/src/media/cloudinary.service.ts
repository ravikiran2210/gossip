import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
    this.logger.log('Cloudinary configured');
  }

  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto',
    folder?: string,
  ): Promise<UploadApiResponse> {
    const uploadFolder = folder || this.config.get<string>('CLOUDINARY_UPLOAD_FOLDER') || 'messenger';
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: uploadFolder,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!);
        },
      );
      uploadStream.end(buffer);
    });
  }

  async delete(publicId: string, resourceType: 'image' | 'video' | 'raw' | 'auto' = 'image') {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }
}
