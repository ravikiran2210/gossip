import { Controller, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AccessCodesService } from './access-codes.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Controller('admin/access-codes')
@UseGuards(AdminJwtGuard)
export class AccessCodesController {
  constructor(
    private readonly accessCodesService: AccessCodesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  async revoke(@Param('id') id: string, @CurrentAdmin() admin: any) {
    const code = await this.accessCodesService.revoke(id, admin._id.toString());
    await this.auditLogsService.log({
      actorType: 'admin',
      actorId: admin._id,
      action: 'access_code.revoked',
      targetType: 'access_code',
      targetId: id,
    });
    return code;
  }
}
