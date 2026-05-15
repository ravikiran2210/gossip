import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageReceipt, MessageReceiptSchema } from '../schemas/message-receipt.schema';
import { ReceiptsService } from './receipts.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: MessageReceipt.name, schema: MessageReceiptSchema }])],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
