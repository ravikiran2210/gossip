import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../schemas/message.schema';
import { MessageReceipt, MessageReceiptSchema } from '../schemas/message-receipt.schema';
import { Conversation, ConversationSchema } from '../schemas/conversation.schema';
import { ConversationMember, ConversationMemberSchema } from '../schemas/conversation-member.schema';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: MessageReceipt.name, schema: MessageReceiptSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationMember.name, schema: ConversationMemberSchema },
    ]),
    ConversationsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
