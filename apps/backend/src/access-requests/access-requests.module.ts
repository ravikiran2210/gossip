import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessRequest, AccessRequestSchema } from '../schemas/access-request.schema';
import { AccessRequestsController } from './access-requests.controller';
import { AccessRequestsService } from './access-requests.service';
import { AccessCodesModule } from '../access-codes/access-codes.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AccessRequest.name, schema: AccessRequestSchema }]),
    forwardRef(() => AccessCodesModule),
  ],
  controllers: [AccessRequestsController],
  providers: [AccessRequestsService],
  exports: [AccessRequestsService],
})
export class AccessRequestsModule {}
