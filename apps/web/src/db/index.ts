import Dexie, { Table } from 'dexie';
import type { Conversation, Message, User, ConversationMember, MediaFile } from '../types';

export interface LocalReceipt {
  id?: number;
  messageId: string;
  userId: string;
  status: 'delivered' | 'read';
  createdAt: string;
}

export interface SyncState {
  id?: number;
  key: string;
  value: string;
}

export interface PendingQueueItem {
  id?: number;
  messageId: string;
  conversationId: string;
  payload: string;
  createdAt: string;
  // TODO: Process pending queue when coming back online (offline queue feature)
}

class MessengerDB extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;
  users!: Table<User>;
  members!: Table<ConversationMember>;
  receipts!: Table<LocalReceipt>;
  media!: Table<MediaFile>;
  syncState!: Table<SyncState>;
  pendingQueue!: Table<PendingQueueItem>;

  constructor() {
    super('MessengerDB');
    this.version(1).stores({
      conversations: '_id, type, lastMessageAt',
      messages: '_id, messageId, conversationId, createdAt, senderId',
      users: '_id, username, email',
      members: '_id, conversationId, userId',
      receipts: '++id, messageId, userId, status',
      media: '_id, fileId',
      syncState: '++id, key',
      pendingQueue: '++id, messageId, conversationId',
    });
  }
}

export const db = new MessengerDB();

// Helper: upsert conversation
export async function upsertConversation(conv: Conversation) {
  await db.conversations.put(conv);
}

// Helper: upsert message
export async function upsertMessage(msg: Message) {
  await db.messages.put(msg);
}

// Helper: upsert user
export async function upsertUser(user: User) {
  await db.users.put(user);
}

// Helper: get last sync time
export async function getLastSync(): Promise<Date | null> {
  const record = await db.syncState.where('key').equals('lastSync').first();
  return record ? new Date(record.value) : null;
}

// Helper: set last sync time
export async function setLastSync(date: Date) {
  const existing = await db.syncState.where('key').equals('lastSync').first();
  if (existing?.id) {
    await db.syncState.update(existing.id, { value: date.toISOString() });
  } else {
    await db.syncState.add({ key: 'lastSync', value: date.toISOString() });
  }
}
