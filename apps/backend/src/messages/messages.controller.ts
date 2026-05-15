import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString } from 'class-validator';
import { MessagesService } from './messages.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class ReactionDto {
  @IsString() emoji: string;
}

@Controller()
@UseGuards(UserJwtGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations/:conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getMessages(conversationId, userId, limit ? +limit : 50, before);
  }

  @Get('conversations/:conversationId/messages/search')
  searchMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Query('q') q: string,
  ) {
    return this.messagesService.searchMessages(conversationId, userId, q);
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.OK)
  markConversationRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.messagesService.markConversationRead(conversationId, userId);
  }

  @Post('messages/:messageId/reactions')
  toggleReaction(
    @Param('messageId') messageId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: ReactionDto,
  ) {
    return this.messagesService.toggleReaction(messageId, userId, dto.emoji);
  }

  @Patch('messages/:messageId/delete-for-me')
  @HttpCode(HttpStatus.OK)
  deleteForMe(@Param('messageId') messageId: string, @CurrentUser('sub') userId: string) {
    return this.messagesService.deleteForMe(messageId, userId);
  }

  @Patch('messages/:messageId/delete-for-everyone')
  @HttpCode(HttpStatus.OK)
  deleteForEveryone(@Param('messageId') messageId: string, @CurrentUser('sub') userId: string) {
    return this.messagesService.deleteForEveryone(messageId, userId);
  }

  @Post('messages/:messageId/delivered')
  markDelivered(@Param('messageId') messageId: string, @CurrentUser('sub') userId: string) {
    return this.messagesService.markDelivered(messageId, userId);
  }

  @Post('messages/:messageId/read')
  markRead(@Param('messageId') messageId: string, @CurrentUser('sub') userId: string) {
    return this.messagesService.markRead(messageId, userId);
  }
}
