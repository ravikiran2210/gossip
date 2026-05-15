import { Injectable, Logger } from '@nestjs/common';

/**
 * In-memory socket connection registry.
 *
 * TODO: When scaling to multiple backend instances (horizontal scaling on Render
 * paid plan or other providers), replace this in-memory registry with Redis-backed
 * Socket.IO adapter (e.g., @socket.io/redis-adapter) and a Redis pub/sub store.
 * The current implementation only works correctly with a single backend instance.
 */
@Injectable()
export class ConnectionRegistry {
  private readonly logger = new Logger(ConnectionRegistry.name);
  // userId -> Set of socketIds
  private readonly userSockets = new Map<string, Set<string>>();
  // socketId -> userId
  private readonly socketUser = new Map<string, string>();

  register(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.socketUser.set(socketId, userId);
    this.logger.debug(`Registered socket ${socketId} for user ${userId}`);
  }

  unregister(socketId: string) {
    const userId = this.socketUser.get(socketId);
    if (userId) {
      this.userSockets.get(userId)?.delete(socketId);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUser.delete(socketId);
  }

  getSocketIds(userId: string): string[] {
    return Array.from(this.userSockets.get(userId) || []);
  }

  isOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  getUserId(socketId: string): string | undefined {
    return this.socketUser.get(socketId);
  }
}
