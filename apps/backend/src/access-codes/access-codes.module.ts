import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessCode, AccessCodeSchema } from '../schemas/access-code.schema';
import { AccessCodesService } from './access-codes.service';
import { AccessCodesController } from './access-codes.controller';
import { AccessRequestsModule } from '../access-requests/access-requests.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AccessCode.name, schema: AccessCodeSchema }]),
    forwardRef(() => AccessRequestsModule),
  ],
  providers: [AccessCodesService],
  controllers: [AccessCodesController],
  exports: [AccessCodesService],
})
export class AccessCodesModule {}
