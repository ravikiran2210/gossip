import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ConversationsService, CreateDirectDto, CreateGroupDto } from './conversations.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(UserJwtGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('direct')
  createDirect(@CurrentUser('sub') userId: string, @Body() dto: CreateDirectDto) {
    return this.conversationsService.createDirect(userId, dto.targetUserId);
  }

  @Post('group')
  createGroup(@CurrentUser('sub') userId: string, @Body() dto: CreateGroupDto) {
    return this.conversationsService.createGroup(userId, dto);
  }

  @Get()
  getMyConversations(@CurrentUser('sub') userId: string): Promise<Record<string, any>[]> {
    return this.conversationsService.getUserConversations(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser('sub') userId: string): Promise<Record<string, any>> {
    return this.conversationsService.getById(id, userId);
  }

  @Patch(':id/pin')
  pinConversation(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body('pin') pin: boolean,
  ) {
    return this.conversationsService.pinConversation(id, userId, pin);
  }
}
