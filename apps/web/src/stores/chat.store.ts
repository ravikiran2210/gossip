import { create } from 'zustand';
import { api } from '../services/api';
import { db, upsertConversation, upsertMessage } from '../db';
import type { Conversation, Message, MessageReaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  onlineUsers: Record<string, { isOnline: boolean; lastSeenAt?: string }>;
  replyingTo: Message | null;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  addMessage: (msg: Message) => void;
  upsertConversation: (conv: Conversation) => void;
  setTyping: (conversationId: string, userIds: string[]) => void;
  setOnlineStatus: (userId: string, isOnline: boolean, lastSeenAt?: string) => void;
  setReplyingTo: (msg: Message | null) => void;
  updateMessageReactions: (messageId: string, reactions: MessageReaction[]) => void;
  deleteMessage: (messageId: string, forEveryone: boolean) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  markConversationRead: (conversationId: string) => void;
  pinConversation: (conversationId: string, pin: boolean) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: {},
  replyingTo: null,
  isLoadingConversations: false,
  isLoadingMessages: false,

  loadConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const cached = await db.conversations.orderBy('lastMessageAt').reverse().toArray();
      if (cached.length) set({ conversations: cached });

      const { data } = await api.get('/conversations');
      const convs: Conversation[] = data;
      for (const c of convs) await upsertConversation(c);
      set({ conversations: convs });
    } catch {
      // Offline: use cached data
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  loadMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true });
    try {
      const cached = await db.messages
        .where('conversationId')
        .equals(conversationId)
        .sortBy('createdAt');
      if (cached.length) {
        set((s) => ({ messages: { ...s.messages, [conversationId]: cached } }));
      }

      const { data } = await api.get(`/conversations/${conversationId}/messages?limit=50`);
      const msgs: Message[] = (data as Message[]).reverse();
      for (const m of msgs) await upsertMessage(m);
      set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } }));
    } catch {
      // Use cached
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (msg) => {
    set((s) => {
      const existing = s.messages[msg.conversationId] || [];
      const idx = existing.findIndex((m) => m.messageId === msg.messageId);
      let updated: Message[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...existing[idx], ...msg };
      } else {
        updated = [...existing, msg];
      }

      // Update conversation's last message preview in the list
      const convs = s.conversations.map((c) =>
        c._id === msg.conversationId
          ? { ...c, lastMessageAt: msg.createdAt }
          : c,
      );

      return { messages: { ...s.messages, [msg.conversationId]: updated }, conversations: convs };
    });
    upsertMessage(msg).catch(() => {});
  },

  upsertConversation: (conv) => {
    set((s) => {
      const idx = s.conversations.findIndex((c) => c._id === conv._id);
      if (idx >= 0) {
        const updated = [...s.conversations];
        updated[idx] = { ...updated[idx], ...conv };
        return { conversations: updated };
      }
      return { conversations: [conv, ...s.conversations] };
    });
    upsertConversation(conv).catch(() => {});
  },

  setTyping: (conversationId, userIds) =>
    set((s) => ({ typingUsers: { ...s.typingUsers, [conversationId]: userIds } })),

  setOnlineStatus: (userId, isOnline, lastSeenAt) =>
    set((s) => ({
      onlineUsers: { ...s.onlineUsers, [userId]: { isOnline, lastSeenAt } },
    })),

  setReplyingTo: (msg) => set({ replyingTo: msg }),

  updateMessageReactions: (messageId, reactions) => {
    set((s) => {
      const updated = { ...s.messages };
      for (const convId of Object.keys(updated)) {
        const msgs = updated[convId];
        const idx = msgs.findIndex((m) => m._id === messageId || m.messageId === messageId);
        if (idx >= 0) {
          updated[convId] = [...msgs];
          updated[convId][idx] = { ...msgs[idx], reactions };
          break;
        }
      }
      return { messages: updated };
    });
  },

  deleteMessage: (messageId, forEveryone) => {
    set((s) => {
      const updated = { ...s.messages };
      for (const convId of Object.keys(updated)) {
        const msgs = updated[convId];
        const idx = msgs.findIndex((m) => m._id === messageId || m.messageId === messageId);
        if (idx >= 0) {
          updated[convId] = [...msgs];
          if (forEveryone) {
            updated[convId][idx] = { ...msgs[idx], deletedForEveryone: true, encryptedPayload: '' };
          } else {
            // Remove entirely from local view
            updated[convId] = msgs.filter((_, i) => i !== idx);
          }
          break;
        }
      }
      return { messages: updated };
    });
  },

  updateMessageStatus: (messageId, status) => {
    set((s) => {
      const updated = { ...s.messages };
      for (const convId of Object.keys(updated)) {
        const msgs = updated[convId];
        const idx = msgs.findIndex((m) => m._id === messageId || m.messageId === messageId);
        if (idx >= 0) {
          updated[convId] = [...msgs];
          updated[convId][idx] = { ...msgs[idx], status };
          break;
        }
      }
      return { messages: updated };
    });
  },

  markConversationRead: (conversationId) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
    api.post(`/conversations/${conversationId}/read`).catch(() => {});
  },

  pinConversation: async (conversationId, pin) => {
    await api.patch(`/conversations/${conversationId}/pin`, { pin });
    set((s) => ({
      conversations: s.conversations
        .map((c) =>
          c._id === conversationId
            ? { ...c, pinnedAt: pin ? new Date().toISOString() : null }
            : c,
        )
        .sort((a, b) => {
          if (a.pinnedAt && !b.pinnedAt) return -1;
          if (!a.pinnedAt && b.pinnedAt) return 1;
          const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bt - at;
        }),
    }));
  },
}));
