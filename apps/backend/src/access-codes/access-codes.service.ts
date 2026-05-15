import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AccessCode, AccessCodeDocument } from '../schemas/access-code.schema';
import { ConfigService } from '@nestjs/config';

export interface VerifyResult {
  code: AccessCodeDocument;
  isReturningUser: boolean; // true = bound code, user already has an account
}

@Injectable()
export class AccessCodesService {
  constructor(
    @InjectModel(AccessCode.name)
    private readonly accessCodeModel: Model<AccessCodeDocument>,
    private readonly config: ConfigService,
  ) {}

  private generateRawCode(): string {
    return crypto.randomBytes(9).toString('base64url').substring(0, 12).toUpperCase();
  }

  async generate(requestId: string, adminId: string) {
    const rawCode = this.generateRawCode();
    const codeHash = await bcrypt.hash(rawCode, 10);
    const expiresHours = this.config.get<number>('accessCode.expiresHours') || 12;
    const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);

    const accessCode = await this.accessCodeModel.create({
      codeHash,
      rawCode,
      requestId: new Types.ObjectId(requestId),
      createdByAdminId: new Types.ObjectId(adminId),
      status: 'active',
      expiresAt,
    });

    return { rawCode, accessCode };
  }

  /**
   * Verify a raw access code.
   *
   * - "active" codes  → initial onboarding window (checks expiry)
   * - "bound" codes   → permanent login credential (no expiry check — they last forever)
   *
   * Returns the code document plus a flag indicating whether this is a
   * returning user (bound) or a brand-new onboarding (active).
   */
  async verify(rawCode: string): Promise<VerifyResult> {
    // First check bound codes (returning users) — no expiry
    const boundCodes = await this.accessCodeModel.find({ status: 'bound' });
    for (const code of boundCodes) {
      const match = await bcrypt.compare(rawCode, code.codeHash);
      if (match) return { code, isReturningUser: true };
    }

    // Then check active codes (new users) — must not be expired
    const activeCodes = await this.accessCodeModel.find({
      status: 'active',
      expiresAt: { $gt: new Date() },
    });
    for (const code of activeCodes) {
      const match = await bcrypt.compare(rawCode, code.codeHash);
      if (match) return { code, isReturningUser: false };
    }

    throw new BadRequestException('Invalid or expired access code');
  }

  /**
   * Called after profile setup.
   * Permanently binds the code to the user — becomes their login credential forever.
   * The code never expires or changes from this point.
   */
  async markBound(codeId: Types.ObjectId | string, userId: string) {
    await this.accessCodeModel.findByIdAndUpdate(codeId, {
      status: 'bound',
      userId: new Types.ObjectId(userId),
      boundAt: new Date(),
      // Extend expiry far into the future so it is effectively permanent
      expiresAt: new Date('2099-12-31'),
    });
  }

  async revoke(codeId: string, adminId: string) {
    const code = await this.accessCodeModel.findById(codeId);
    if (!code) throw new NotFoundException('Access code not found');
    if (code.status === 'revoked') throw new BadRequestException('Code already revoked');
    code.status = 'revoked';
    await code.save();
    return code;
  }

  /**
   * Generate a new code that is already bound to an existing user.
   * Used when a returning user has forgotten their code.
   * Entering this code skips profile setup and logs them straight in.
   */
  async generateBoundForUser(userId: string, adminId: string) {
    const rawCode = this.generateRawCode();
    const codeHash = await bcrypt.hash(rawCode, 10);

    const accessCode = await this.accessCodeModel.create({
      codeHash,
      rawCode,
      createdByAdminId: new Types.ObjectId(adminId),
      userId: new Types.ObjectId(userId),
      status: 'bound',
      boundAt: new Date(),
      expiresAt: new Date('2099-12-31'),
    });

    return { rawCode, accessCode };
  }

  async findByRequestId(requestId: string) {
    return this.accessCodeModel.find({ requestId: new Types.ObjectId(requestId) }).lean();
  }

  async findByRequestIds(requestIds: string[]) {
    const codes = await this.accessCodeModel
      .find({ requestId: { $in: requestIds.map((id) => new Types.ObjectId(id)) } })
      .select('requestId rawCode status expiresAt boundAt')
      .lean();
    // Return a map keyed by requestId string for easy lookup
    return Object.fromEntries(codes.map((c) => [c.requestId!.toString(), c]));
  }

  async findActiveById(codeId: string): Promise<AccessCodeDocument | null> {
    return this.accessCodeModel.findOne({
      _id: codeId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });
  }
}
