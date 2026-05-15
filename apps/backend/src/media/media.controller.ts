import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('media')
@UseGuards(UserJwtGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 200 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File, @CurrentUser('sub') userId: string) {
    if (!file) throw new BadRequestException('No file provided');
    return this.mediaService.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      userId,
    );
  }

  @Get(':fileId')
  findByFileId(@Param('fileId') fileId: string) {
    return this.mediaService.findByFileId(fileId);
  }
}
