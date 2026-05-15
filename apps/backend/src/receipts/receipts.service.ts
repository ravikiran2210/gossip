import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessageReceipt, MessageReceiptDocument } from '../schemas/message-receipt.schema';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectModel(MessageReceipt.name)
    private readonly receiptModel: Model<MessageReceiptDocument>,
  ) {}

  async getReceiptsForMessage(messageId: string) {
    return this.receiptModel.find({ messageId: new Types.ObjectId(messageId) }).lean();
  }

  async getReceiptsForMessages(messageIds: string[]) {
    return this.receiptModel
      .find({ messageId: { $in: messageIds.map((id) => new Types.ObjectId(id)) } })
      .lean();
  }
}
