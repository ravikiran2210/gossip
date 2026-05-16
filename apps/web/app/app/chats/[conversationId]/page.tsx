'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { getSocket } from '@/services/socket';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { GroupInfoPanel } from '@/components/chat/GroupInfoPanel';
import { Avatar } from '@/components/ui/Avatar';
import type { Conversation, Message } from '@/types';
import { Info, Search, X, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const {
    messages,
    loadMessages,
    setActiveConversation,
    typingUsers,
    onlineUsers,
    setReplyingTo,
    deleteMessage,
    markConversationRead,
  } = useChatStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // true = user is within 120px of the bottom; starts true so initial load scrolls down
  const isNearBottomRef = useRef(true);
  // track previous message count to distinguish new messages from status/reaction updates
  const prevMsgCountRef = useRef(0);
  const searchDebounce = useRef<NodeJS.Timeout>();

  // Update isNearBottomRef as user scrolls
  const handleMessagesScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  useEffect(() => {
    if (!user && !token) { router.replace('/user/verify-code'); return; }
    // Reset scroll state for the new conversation
    prevMsgCountRef.current = 0;
    isNearBottomRef.current = true;
    setActiveConversation(conversationId);
    loadMessages(conversationId);
    markConversationRead(conversationId);

    api.get(`/conversations/${conversationId}`)
      .then(({ data }) => setConversation(data))
      .catch(() => {});

    getSocket().emit('conversation.join', { conversationId });

    return () => {
      getSocket().emit('conversation.leave', { conversationId });
      setActiveConversation(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user, token]);

  // Scroll and read-receipt logic whenever the message list changes
  useEffect(() => {
    const msgs = messages[conversationId];
    if (!msgs?.length) return;

    // Only mark read on the initial load and when new messages arrive — not on
    // every status/reaction update (same count). This avoids an HTTP POST on
    // every delivered/read tick.
    if (prevMsgCountRef.current === 0 || msgs.length > prevMsgCountRef.current) {
      markConversationRead(conversationId);
    }

    const prevCount = prevMsgCountRef.current;
    const newCount = msgs.length;

    if (prevCount === 0) {
      // Initial load — jump instantly to the bottom, no animation
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    } else if (newCount > prevCount) {
      // A new message arrived — only scroll if the user is near the bottom
      // OR if the last message is their own (they just sent it)
      const lastMsg = msgs[newCount - 1];
      const isMine = lastMsg?.senderId === user?._id;
      if (isMine || isNearBottomRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // Same count = status/reaction update — don't scroll at all

    prevMsgCountRef.current = newCount;

    // Emit socket read receipt for the last message sent by someone else
    const lastFromOther = [...msgs].reverse().find((m) => m.senderId !== user?._id);
    if (lastFromOther) {
      getSocket().emit('message.read', {
        messageId: lastFromOther._id,
        conversationId,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages[conversationId]]);

  // Debounced message search — return cleanup so the timeout is cancelled on
  // unmount or when searchQuery/conversationId changes before it fires.
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/conversations/${conversationId}/messages/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(searchDebounce.current);
  }, [searchQuery, conversationId]);

  const convMessages = messages[conversationId] || [];
  const typing = typingUsers[conversationId] || [];

  const senderNames: Record<string, string> = {};
  if (conversation?.members) {
    for (const m of conversation.members) {
      const u = m.userId as any;
      const uid = typeof u === 'object' ? u._id?.toString() : u?.toString();
      if (uid) senderNames[uid] = u?.name || u?.username || uid;
    }
  }

  const getConvName = () => {
    if (!conversation) return 'Chat';
    if (conversation.type === 'group') return conversation.title || 'Group';
    return conversation.otherUser?.name || conversation.otherUser?.username || 'Direct Chat';
  };

  const otherUserId = conversation?.type === 'direct' ? conversation.otherUser?._id : undefined;
  const otherOnline = otherUserId ? (onlineUsers[otherUserId]?.isOnline ?? false) : false;
  const lastSeen = otherUserId ? onlineUsers[otherUserId]?.lastSeenAt : undefined;

  const getSubtitle = () => {
    if (conversation?.type === 'group') {
      return `${conversation.members?.length ?? 0} members`;
    }
    if (otherOnline) return 'Online';
    if (lastSeen) {
      return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
    }
    return null;
  };

  const handleReply = useCallback((msg: Message) => {
    setReplyingTo(msg);
  }, [setReplyingTo]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    getSocket().emit('message.reaction', { messageId, conversationId, emoji });
  }, [conversationId]);

  const handleDelete = useCallback((messageId: string, forEveryone: boolean) => {
    getSocket().emit('message.deleted', { messageId, conversationId, forEveryone });
    deleteMessage(messageId, forEveryone);
  }, [conversationId, deleteMessage]);

  const displayMessages = showSearch && searchQuery.trim() ? searchResults : convMessages;

  return (
    <AppLayout>
      <ConversationList className="hidden md:flex md:w-80 flex-shrink-0" />
      <div className="flex-1 flex min-w-0 min-h-0 relative">
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0 min-h-0">
          {/* Header */}
          <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
            <button
              type="button"
              aria-label="Back to chats"
              onClick={() => router.push('/app/chats')}
              className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <Avatar
              name={getConvName()}
              avatarUrl={conversation?.type === 'direct' ? conversation?.otherUser?.avatarUrl : conversation?.avatarUrl}
              size="sm"
              isOnline={otherOnline}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{getConvName()}</p>
              {getSubtitle() && (
                <p className={`text-xs truncate ${otherOnline ? 'text-green-500' : 'text-gray-400'}`}>
                  {getSubtitle()}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Search messages"
              onClick={() => { setShowSearch((v) => !v); setSearchQuery(''); setSearchResults([]); }}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${showSearch ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              aria-label="Conversation info"
              onClick={() => setShowInfo((v) => !v)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${showInfo ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Info size={20} />
            </button>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages…"
                className="flex-1 text-sm outline-none bg-transparent"
              />
              {isSearching && <span className="text-xs text-gray-400">Searching…</span>}
              {searchQuery && !isSearching && (
                <span className="text-xs text-gray-400">{searchResults.length} results</span>
              )}
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Messages — flex-1 + min-h-0 ensures this scrolls rather than overflowing */}
          <div
            ref={scrollContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto min-h-0 p-4 space-y-0.5 overscroll-contain"
          >
            {displayMessages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">
                  {showSearch && searchQuery ? 'No messages found' : 'No messages yet. Say hi!'}
                </p>
              </div>
            )}
            {displayMessages.map((msg) => (
              <MessageBubble
                key={msg.messageId || msg._id}
                message={msg}
                isMine={msg.senderId === user?._id}
                currentUserId={user?._id}
                senderName={conversation?.type === 'group' ? (senderNames[msg.senderId] || msg.senderId) : undefined}
                onReply={handleReply}
                onReact={handleReact}
                onDelete={handleDelete}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {typing.length > 0 && <TypingIndicator userIds={typing} />}

          {/* Input */}
          {!showSearch && <MessageInput conversationId={conversationId} />}
        </div>

        {/* Group info panel — overlay on mobile, sidebar on desktop */}
        {showInfo && conversation && (
          <>
            <div className="absolute inset-0 z-40 bg-black/20 md:hidden" onClick={() => setShowInfo(false)} />
            <div className="absolute right-0 top-0 bottom-0 z-50 md:relative md:inset-auto md:z-auto shadow-xl md:shadow-none">
              <GroupInfoPanel
                conversation={conversation}
                currentUserId={user?._id || ''}
                onClose={() => setShowInfo(false)}
                onConversationUpdate={setConversation}
              />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
