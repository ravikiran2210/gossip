import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccessRequest, AccessRequestDocument } from '../schemas/access-request.schema';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAccessRequestDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() @MaxLength(500) message?: string;
}

@Injectable()
export class AccessRequestsService {
  constructor(
    @InjectModel(AccessRequest.name)
    private readonly accessRequestModel: Model<AccessRequestDocument>,
  ) {}

  async create(dto: CreateAccessRequestDto) {
    const existing = await this.accessRequestModel.findOne({
      email: dto.email.toLowerCase(),
      status: 'pending',
    });
    if (existing) {
      throw new BadRequestException('A pending request already exists for this email');
    }
    return this.accessRequestModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
    });
  }

  async findAll(status?: string, page = 1, limit = 20) {
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      this.accessRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.accessRequestModel.countDocuments(filter),
    ]);
    return { requests, total, page, limit };
  }

  async findById(id: string) {
    const req = await this.accessRequestModel.findById(id).lean();
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  async accept(id: string, adminId: string) {
    const req = await this.accessRequestModel.findById(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') throw new BadRequestException('Request is not pending');
    req.status = 'accepted';
    req.reviewedByAdminId = new Types.ObjectId(adminId);
    req.reviewedAt = new Date();
    await req.save();
    return req;
  }

  async reject(id: string, adminId: string) {
    const req = await this.accessRequestModel.findById(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'pending') throw new BadRequestException('Request is not pending');
    req.status = 'rejected';
    req.reviewedByAdminId = new Types.ObjectId(adminId);
    req.reviewedAt = new Date();
    await req.save();
    return req;
  }

  async getPendingCount() {
    return this.accessRequestModel.countDocuments({ status: 'pending' });
  }
}
