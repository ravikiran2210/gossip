import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

export interface CreateAuditLogDto {
  actorType: 'admin' | 'user' | 'system';
  actorId?: string | Types.ObjectId;
  action: string;
  targetType?: string;
  targetId?: string | Types.ObjectId;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    await this.auditLogModel.create({
      actorType: dto.actorType,
      actorId: dto.actorId,
      action: dto.action,
      targetType: dto.targetType,
      targetId: dto.targetId,
      metadata: dto.metadata,
    });
  }

  async findAll(limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.auditLogModel.countDocuments(),
    ]);
    return { logs, total, page, limit };
  }
}
