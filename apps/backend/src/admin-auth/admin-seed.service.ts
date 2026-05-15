import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AdminUser, AdminUserDocument } from '../schemas/admin-user.schema';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUserDocument>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const seedEmail = this.config.get<string>('ADMIN_SEED_EMAIL');
    if (!seedEmail) {
      this.logger.warn('ADMIN_SEED_EMAIL not set — skipping admin seed');
      return;
    }

    const seedPassword = this.config.get<string>('ADMIN_SEED_PASSWORD');
    if (!seedPassword) {
      this.logger.warn('ADMIN_SEED_PASSWORD not set — skipping admin seed');
      return;
    }

    const seedName     = this.config.get<string>('ADMIN_SEED_NAME')     || 'Super Admin';
    const seedUsername = this.config.get<string>('ADMIN_SEED_USERNAME') || 'superadmin';
    const passwordHash = await bcrypt.hash(seedPassword, 12);

    // Upsert: create if not exists, update credentials if already exists.
    // This means your .env values are always the source of truth —
    // change them and restart to apply immediately.
    const result = await this.adminUserModel.findOneAndUpdate(
      { email: seedEmail },
      {
        $set: {
          name:         seedName,
          username:     seedUsername,
          passwordHash,
          role:         'super_admin',
          status:       'active',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    this.logger.log(`✅ Admin synced from .env → ${seedEmail} (@${seedUsername})`);
  }
}
