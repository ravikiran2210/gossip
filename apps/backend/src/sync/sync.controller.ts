import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sync')
@UseGuards(UserJwtGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('missed')
  getMissed(
    @CurrentUser('sub') userId: string,
    @Query('since') since: string,
  ) {
    if (!since) return { messages: [] };
    return this.syncService.getMissedMessages(userId, since);
  }
}
