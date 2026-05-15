import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AccessRequestsService, CreateAccessRequestDto } from './access-requests.service';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { AccessCodesService } from '../access-codes/access-codes.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AccessRequestsController {
  constructor(
    private readonly accessRequestsService: AccessRequestsService,
    private readonly accessCodesService: AccessCodesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // Public — user submits request
  @Post('access/request')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Body() dto: CreateAccessRequestDto) {
    return this.accessRequestsService.create(dto);
  }

  // Admin — view requests
  @Get('admin/requests')
  @UseGuards(AdminJwtGuard)
  async findAll(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.accessRequestsService.findAll(status, page ? +page : 1, limit ? +limit : 20);
    if (result.requests.length > 0) {
      const codeMap = await this.accessCodesService.findByRequestIds(
        result.requests.map((r: any) => r._id.toString()),
      );
      return {
        ...result,
        requests: result.requests.map((r: any) => ({
          ...r,
          accessCode: codeMap[r._id.toString()] ?? null,
        })),
      };
    }
    return result;
  }

  @Get('admin/requests/:id')
  @UseGuards(AdminJwtGuard)
  findById(@Param('id') id: string) {
    return this.accessRequestsService.findById(id);
  }

  // Admin — accept request -> auto-generate access code
  @Post('admin/requests/:id/accept')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async accept(@Param('id') id: string, @CurrentAdmin() admin: any) {
    const req = await this.accessRequestsService.accept(id, admin._id.toString());
    const { rawCode, accessCode } = await this.accessCodesService.generate(id, admin._id.toString());
    await this.auditLogsService.log({
      actorType: 'admin',
      actorId: admin._id,
      action: 'access_request.accepted',
      targetType: 'access_request',
      targetId: id,
    });
    // rawCode shown to admin ONCE — never stored in DB
    return { request: req, accessCodeId: accessCode._id, rawCode };
  }

  // Admin — reissue a new bound code for a user who forgot their code
  @Post('admin/requests/:id/reissue')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async reissue(@Param('id') id: string, @CurrentAdmin() admin: any) {
    const req = await this.accessRequestsService.findById(id);
    if (req.status !== 'accepted') throw new Error('Request must be accepted to reissue a code');

    // Find the existing bound code to get the userId
    const existingCodes = await this.accessCodesService.findByRequestId(id);
    const boundCode = existingCodes.find((c: any) => c.userId);
    if (!boundCode?.userId) throw new Error('No linked user found for this request');

    const { rawCode, accessCode } = await this.accessCodesService.generateBoundForUser(
      boundCode.userId.toString(),
      admin._id.toString(),
    );
    await this.auditLogsService.log({
      actorType: 'admin',
      actorId: admin._id,
      action: 'access_code.reissued',
      targetType: 'access_request',
      targetId: id,
    });
    return { accessCodeId: accessCode._id, rawCode };
  }

  // Admin — reject request
  @Post('admin/requests/:id/reject')
  @UseGuards(AdminJwtGuard)
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string, @CurrentAdmin() admin: any) {
    const req = await this.accessRequestsService.reject(id, admin._id.toString());
    await this.auditLogsService.log({
      actorType: 'admin',
      actorId: admin._id,
      action: 'access_request.rejected',
      targetType: 'access_request',
      targetId: id,
    });
    return req;
  }
}
