import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagesModule } from '../messages/messages.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { UsersModule } from '../users/users.module';
import { ChatGateway } from './chat.gateway';
import { ConnectionRegistry } from './connection-registry';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MessagesModule,
    ReceiptsModule,
    UsersModule,
  ],
  providers: [ChatGateway, ConnectionRegistry],
  exports: [ConnectionRegistry],
})
export class RealtimeModule {}
