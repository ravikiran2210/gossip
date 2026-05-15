// ============================================================
// Shared TypeScript types used by both backend and frontend.
// Backend uses Mongoose documents; frontend mirrors these shapes.
// ============================================================

export type AdminRole = 'super_admin' | 'admin';
export type AdminStatus = 'active' | 'disabled';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export type AccessCodeStatus = 'active' | 'used' | 'expired' | 'revoked';

export type UserStatus = 'active' | 'suspended' | 'blocked';

export type ConversationType = 'direct' | 'group';

export type MemberRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'active' | 'left' | 'removed';

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'gif'
  | 'emoji'
  | 'system';

export type ReceiptStatus = 'delivered' | 'read';

export type MediaResourceType = 'image' | 'video' | 'raw' | 'auto';
export type MediaStatus = 'pending' | 'uploaded' | 'failed';

export type AuditActorType = 'admin' | 'user' | 'system';

// ── Lean DTOs (safe to pass over the wire) ──────────────────

export interface UserPublicProfile {
  _id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  status: UserStatus;
}

export interface ConversationSummary {
  _id: string;
  type: ConversationType;
  title?: string;
  avatarUrl?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface MessagePayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  encryptedPayload: string; // plaintext for now; swap with real E2EE later
  mediaId?: string;
  createdAt: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface ReceiptPayload {
  messageId: string;
  userId: string;
  status: ReceiptStatus;
}
