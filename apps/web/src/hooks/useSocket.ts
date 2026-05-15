'use client';
import { useEffect } from 'react';
import { getSocket } from '../services/socket';
import { useChatStore } from '../stores/chat.store';
import { useAuthStore } from '../stores/auth.store';
import type { Message, MessageReaction } from '../types';

export function useSocket() {
  const addMessage = useChatStore((s) => s.addMessage);
  const upsertConv = useChatStore((s) => s.upsertConversation);
  const setTyping = useChatStore((s) => s.setTyping);
  const setOnlineStatus = useChatStore((s) => s.setOnlineStatus);
  const updateMessageReactions = useChatStore((s) => s.updateMessageReactions);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const deleteMessage = useChatStore((s) => s.deleteMessage);

  useEffect(() => {
    const socket = getSocket();

    socket.on('message.new', (msg: Message) => {
      addMessage({ ...msg, status: 'delivered' });

      // If this message is from someone else and we're currently viewing that conversation,
      // immediately emit read so the sender's UI updates to double-blue tick.
      const { activeConversationId } = useChatStore.getState();
      const { user } = useAuthStore.getState();
      if (
        msg.senderId !== user?._id &&
        activeConversationId === msg.conversationId
      ) {
        socket.emit('message.read', {
          messageId: msg._id,
          conversationId: msg.conversationId,
        });
      }
    });

    socket.on('message.sent', (_data: { messageId: string }) => {
      // Ack — no status update needed; addMessage already sets delivered
    });

    socket.on('message.delivered', (data: { messageId: string; userId: string }) => {
      // The sender receives this when a recipient gets the message → upgrade to delivered
      updateMessageStatus(data.messageId, 'delivered');
    });

    socket.on('message.read', (data: { messageId: string; userId: string }) => {
      // The sender receives this when a recipient reads the message → upgrade to read
      updateMessageStatus(data.messageId, 'read');
    });

    socket.on('message.reaction', (data: { messageId: string; reactions: MessageReaction[] }) => {
      updateMessageReactions(data.messageId, data.reactions);
    });

    socket.on('message.deleted', (data: { messageId: string; forEveryone: boolean }) => {
      deleteMessage(data.messageId, data.forEveryone);
    });

    socket.on('user.status', (data: { userId: string; isOnline: boolean; lastSeenAt?: string }) => {
      setOnlineStatus(data.userId, data.isOnline, data.lastSeenAt);
    });

    socket.on('typing.start', (data: { conversationId: string; userId: string }) => {
      const store = useChatStore.getState();
      const current = store.typingUsers[data.conversationId] || [];
      if (!current.includes(data.userId)) {
        store.setTyping(data.conversationId, [...current, data.userId]);
      }
    });

    socket.on('typing.stop', (data: { conversationId: string; userId: string }) => {
      const store = useChatStore.getState();
      const current = store.typingUsers[data.conversationId] || [];
      store.setTyping(
        data.conversationId,
        current.filter((id) => id !== data.userId),
      );
    });

    socket.on('conversation.created', (conv: any) => upsertConv(conv));
    socket.on('conversation.updated', (conv: any) => upsertConv(conv));

    return () => {
      socket.off('message.new');
      socket.off('message.sent');
      socket.off('message.delivered');
      socket.off('message.read');
      socket.off('message.reaction');
      socket.off('message.deleted');
      socket.off('user.status');
      socket.off('typing.start');
      socket.off('typing.stop');
      socket.off('conversation.created');
      socket.off('conversation.updated');
    };
  }, [addMessage, upsertConv, setTyping, setOnlineStatus, updateMessageReactions, updateMessageStatus, deleteMessage]);
}
