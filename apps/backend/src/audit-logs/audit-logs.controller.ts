import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';

@Controller('admin/audit-logs')
@UseGuards(AdminJwtGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.auditLogsService.findAll(
      limit ? parseInt(limit) : 50,
      page ? parseInt(page) : 1,
    );
  }
}
