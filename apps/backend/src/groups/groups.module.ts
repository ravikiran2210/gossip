import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConversationMember, ConversationMemberSchema } from '../schemas/conversation-member.schema';
import { Conversation, ConversationSchema } from '../schemas/conversation.schema';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConversationMember.name, schema: ConversationMemberSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
