import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { AdminUsersService } from './admin-users.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';

class UpdateUserStatusDto {
  @IsIn(['active', 'suspended', 'blocked'])
  status: 'active' | 'suspended' | 'blocked';
}

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminUsersService.getDashboardStats();
  }

  @Get('users')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string) {
    return this.adminUsersService.findAll(page ? +page : 1, limit ? +limit : 20, status);
  }

  @Get('users/:id')
  findById(@Param('id') id: string) {
    return this.adminUsersService.findById(id);
  }

  @Patch('users/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentAdmin() admin: any,
  ) {
    const user = await this.adminUsersService.updateStatus(id, dto.status);
    await this.auditLogsService.log({
      actorType: 'admin',
      actorId: admin._id,
      action: `user.status.${dto.status}`,
      targetType: 'user',
      targetId: id,
    });
    return user;
  }

  @Get('groups')
  getGroups(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminUsersService.getAdminGroupList(page ? +page : 1, limit ? +limit : 20);
  }
}
