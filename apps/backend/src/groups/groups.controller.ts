import { Controller, Post, Delete, Patch, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { UserJwtGuard } from '../common/guards/user-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsArray, IsIn } from 'class-validator';

class AddMembersDto {
  @IsArray() userIds: string[];
}

class UpdateRoleDto {
  @IsIn(['admin', 'member']) role: 'admin' | 'member';
}

@Controller('groups')
@UseGuards(UserJwtGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post(':conversationId/members')
  addMembers(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.groupsService.addMembers(conversationId, userId, dto.userIds);
  }

  @Delete(':conversationId/members/:userId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @Param('conversationId') conversationId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.groupsService.removeMember(conversationId, userId, targetUserId);
  }

  @Post(':conversationId/leave')
  @HttpCode(HttpStatus.OK)
  leaveGroup(
    @Param('conversationId') conversationId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.groupsService.leaveGroup(conversationId, userId);
  }

  @Patch(':conversationId/members/:userId/role')
  updateRole(
    @Param('conversationId') conversationId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.groupsService.updateMemberRole(conversationId, userId, targetUserId, dto.role);
  }
}
