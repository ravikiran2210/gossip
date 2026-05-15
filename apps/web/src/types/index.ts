export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'disabled';
}

export interface AccessRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedByAdminId?: string;
  reviewedAt?: string;
  createdAt: string;
  accessCode?: {
    rawCode: string;
    status: 'active' | 'bound' | 'expired' | 'revoked';
    expiresAt: string;
    boundAt?: string;
  } | null;
}

export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  status: 'active' | 'suspended' | 'blocked';
  createdAt: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'gif' | 'emoji' | 'system';

export interface MessageReaction {
  emoji: string;
  userId: string;
}

export interface Message {
  _id: string;
  messageId: string;
  conversationId: string;
  senderId: string;
  messageType: MessageType;
  encryptedPayload: string;
  mediaId?: string;
  fileName?: string;
  replyToId?: string | ReplyPreview;
  reactions?: MessageReaction[];
  deletedForEveryone?: boolean;
  createdAt: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ReplyPreview {
  _id: string;
  senderId: string;
  messageType: MessageType;
  encryptedPayload: string;
  fileName?: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  title?: string;
  avatarUrl?: string;
  directKey?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  pinnedAt?: string | null;
  unreadCount?: number;
  members?: ConversationMember[];
  otherUser?: { _id: string; name: string; username: string; avatarUrl?: string; isOnline?: boolean; lastSeenAt?: string };
}

export interface ConversationMember {
  _id: string;
  conversationId: string;
  userId: string | User;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'left' | 'removed';
  joinedAt: string;
}

export interface MediaFile {
  _id: string;
  fileId: string;
  secureUrl: string;
  url: string;
  resourceType: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export interface AuditLog {
  _id: string;
  actorType: 'admin' | 'user' | 'system';
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
