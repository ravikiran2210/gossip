import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { ConnectionRegistry } from './connection-registry';

const EVENTS = {
  MESSAGE_SEND: 'message.send',
  MESSAGE_SENT: 'message.sent',
  MESSAGE_NEW: 'message.new',
  MESSAGE_DELIVERED: 'message.delivered',
  MESSAGE_READ: 'message.read',
  MESSAGE_REACTION: 'message.reaction',
  MESSAGE_DELETED: 'message.deleted',
  TYPING_START: 'typing.start',
  TYPING_STOP: 'typing.stop',
  CONVERSATION_JOIN: 'conversation.join',
  CONVERSATION_LEAVE: 'conversation.leave',
  GROUP_MEMBER_ADDED: 'group.member.added',
  GROUP_MEMBER_REMOVED: 'group.member.removed',
  GROUP_MEMBER_LEFT: 'group.member.left',
  USER_STATUS: 'user.status',
  SOCKET_ERROR: 'socket.error',
};

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly registry: ConnectionRegistry,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token);
      if (payload.type !== 'user') {
        client.disconnect(true);
        return;
      }

      const userId = payload.sub as string;
      client.data.userId = userId;
      this.registry.register(userId, client.id);
      this.logger.log(`User ${userId} connected via ${client.id}`);

      // Update DB status only — we broadcast to rooms when the user joins them
      await this.usersService.setOnlineStatus(userId, true);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;

    // Capture rooms before unregistering so we can broadcast to them
    const convRooms = Array.from(client.rooms as Set<string>).filter((r) =>
      r.startsWith('conv:'),
    );

    this.registry.unregister(client.id);
    this.logger.log(`Socket ${client.id} disconnected`);

    if (userId) {
      const remaining = this.registry.getSocketIds(userId);
      if (remaining.length === 0) {
        // Wrap in try-catch — a DB failure here must not crash the handler
        try {
          await this.usersService.setOnlineStatus(userId, false);
          const status = await this.usersService.getStatus(userId);

          // Broadcast only to conversation rooms the user was in, not globally
          for (const room of convRooms) {
            this.server.to(room).emit(EVENTS.USER_STATUS, {
              userId,
              isOnline: false,
              lastSeenAt: status.lastSeenAt,
            });
          }
        } catch (err) {
          this.logger.error(`Failed to update online status for user ${userId}`, err);
        }
      }
    }
  }

  @SubscribeMessage(EVENTS.CONVERSATION_JOIN)
  async handleConversationJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conv:${data.conversationId}`);

    // Broadcast this user's online status to everyone in the room
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.server.to(`conv:${data.conversationId}`).emit(EVENTS.USER_STATUS, {
        userId,
        isOnline: true,
      });
    }

    return { joined: data.conversationId };
  }

  @SubscribeMessage(EVENTS.CONVERSATION_LEAVE)
  handleConversationLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conv:${data.conversationId}`);
    return { left: data.conversationId };
  }

  @SubscribeMessage(EVENTS.MESSAGE_SEND)
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      messageId: string;
      conversationId: string;
      messageType: string;
      encryptedPayload: string;
      mediaId?: string;
      fileName?: string;
      replyToId?: string;
    },
  ) {
    const senderId = client.data.userId;
    if (!senderId) {
      client.emit(EVENTS.SOCKET_ERROR, { message: 'Not authenticated' });
      return;
    }

    try {
      const message = await this.messagesService.send({
        messageId: data.messageId,
        conversationId: data.conversationId,
        senderId,
        messageType: data.messageType,
        encryptedPayload: data.encryptedPayload,
        mediaId: data.mediaId,
        fileName: data.fileName,
        replyToId: data.replyToId,
      });

      const messageId = message._id.toString();
      const msgPayload = message.toObject ? message.toObject() : message;

      // Ack to sender and broadcast to room immediately — don't wait for receipt writes
      client.emit(EVENTS.MESSAGE_SENT, { messageId: data.messageId, _id: messageId });
      this.server.to(`conv:${data.conversationId}`).emit(EVENTS.MESSAGE_NEW, msgPayload);

      // Mark delivered for online receivers in the background — fire and forget
      this.messagesService
        .getConversationReceivers(data.conversationId, senderId)
        .then((receivers) => {
          const deliverPromises = receivers
            .filter((receiverId) => this.registry.getSocketIds(receiverId).length > 0)
            .map((receiverId) =>
              this.messagesService.markDelivered(messageId, receiverId).then(() => {
                this.server.to(`conv:${data.conversationId}`).emit(EVENTS.MESSAGE_DELIVERED, {
                  messageId,
                  userId: receiverId,
                });
              }),
            );
          return Promise.all(deliverPromises);
        })
        .catch((err) => this.logger.error('Delivery receipt error', err));
    } catch (err: unknown) {
      this.logger.error('Message send error', err);
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      client.emit(EVENTS.SOCKET_ERROR, { message: msg });
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_DELIVERED)
  async handleDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    await this.messagesService.markDelivered(data.messageId, userId);
    this.server.to(`conv:${data.conversationId}`).emit(EVENTS.MESSAGE_DELIVERED, {
      messageId: data.messageId,
      userId,
    });
  }

  @SubscribeMessage(EVENTS.MESSAGE_READ)
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    await this.messagesService.markRead(data.messageId, userId);
    this.server.to(`conv:${data.conversationId}`).emit(EVENTS.MESSAGE_READ, {
      messageId: data.messageId,
      userId,
    });
  }

  @SubscribeMessage(EVENTS.MESSAGE_REACTION)
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string; emoji: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const reactions = await this.messagesService.toggleReaction(data.messageId, userId, data.emoji);
      this.server.to(`conv:${data.conversationId}`).emit(EVENTS.MESSAGE_REACTION, {
        messageId: data.messageId,
        reactions,
      });
    } catch (err) {
      this.logger.error('Reaction error', err);
    }
  }

  @SubscribeMessage(EVENTS.MESSAGE_DELETED)
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string; forEveryone: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      if (data.forEveryone) {
        await this.messagesService.deleteForEveryone(data.messageId, userId);
        this.server.to(`conv:${data.conversationId}`).emit(EVENTS.MESSAGE_DELETED, {
          messageId: data.messageId,
          forEveryone: true,
        });
      } else {
        await this.messagesService.deleteForMe(data.messageId, userId);
        // Only notify the requesting client — other users still see this message
        client.emit(EVENTS.MESSAGE_DELETED, { messageId: data.messageId, forEveryone: false });
      }
    } catch (err) {
      this.logger.error('Delete error', err);
      const msg = err instanceof Error ? err.message : 'Failed to delete message';
      client.emit(EVENTS.SOCKET_ERROR, { message: msg });
    }
  }

  @SubscribeMessage(EVENTS.TYPING_START)
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userName: string },
  ) {
    const userId = client.data.userId;
    client
      .to(`conv:${data.conversationId}`)
      .emit(EVENTS.TYPING_START, { conversationId: data.conversationId, userId, userName: data.userName });
  }

  @SubscribeMessage(EVENTS.TYPING_STOP)
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    client
      .to(`conv:${data.conversationId}`)
      .emit(EVENTS.TYPING_STOP, { conversationId: data.conversationId, userId });
  }

  emitGroupMemberAdded(conversationId: string, payload: any) {
    this.server.to(`conv:${conversationId}`).emit(EVENTS.GROUP_MEMBER_ADDED, payload);
  }

  emitGroupMemberRemoved(conversationId: string, payload: any) {
    this.server.to(`conv:${conversationId}`).emit(EVENTS.GROUP_MEMBER_REMOVED, payload);
  }
}
