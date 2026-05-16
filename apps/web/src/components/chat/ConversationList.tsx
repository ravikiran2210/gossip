'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { formatConversationTime } from '@/utils';
import { cn } from '@/utils';
import { Search, SquarePen, Pin } from 'lucide-react';
import { UserSearchModal } from '@/features/chat/UserSearchModal';
import type { Conversation } from '@/types';

export function ConversationList({ className }: { className?: string }) {
  const pathname = usePathname();
  const { conversations, loadConversations, isLoadingConversations, onlineUsers, pinConversation } = useChatStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const getConvName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.title || 'Group';
    return conv.otherUser?.name || conv.otherUser?.username || 'Direct Chat';
  };

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.avatarUrl;
    return conv.otherUser?.avatarUrl;
  };

  const isOtherUserOnline = (conv: Conversation) => {
    if (conv.type !== 'direct' || !conv.otherUser) return false;
    return onlineUsers[conv.otherUser._id]?.isOnline ?? false;
  };

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    return getConvName(c).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className={cn('w-full md:w-80 bg-white border-r flex flex-col', className)}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/app/profile">
              {user
                ? <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                : <div className="w-8 h-8 rounded-full bg-brand-100" />
              }
            </Link>
            <h1 className="text-xl font-black text-gray-900">Gossip</h1>
          </div>
          <button
            type="button"
            aria-label="New chat"
            onClick={() => setShowNewChat(true)}
            className="w-9 h-9 flex items-center justify-center bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-full transition-colors"
          >
            <SquarePen size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations && conversations.length === 0 ? (
          /* Skeleton shimmer */
          <div className="px-3 space-y-1 mt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-3 px-6 text-center">
            <p>{search ? 'No conversations match your search' : 'No conversations yet'}</p>
            {!search && (
              <button
                type="button"
                onClick={() => setShowNewChat(true)}
                className="text-xs bg-brand-500 text-white px-4 py-2 rounded-full font-medium hover:bg-brand-600 transition-colors"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="px-2 py-1">
            {filtered.map((conv) => {
              const isActive = pathname.includes(conv._id);
              const online = isOtherUserOnline(conv);
              const unread = conv.unreadCount || 0;
              const pinned = !!conv.pinnedAt;

              return (
                <div key={conv._id} className="group relative">
                  <Link
                    href={`/app/chats/${conv._id}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors',
                      isActive
                        ? 'bg-brand-50'
                        : 'hover:bg-gray-50',
                    )}
                  >
                    <Avatar
                      name={getConvName(conv)}
                      avatarUrl={getConvAvatar(conv)}
                      size="md"
                      isOnline={online}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          {pinned && <Pin size={10} className="text-brand-400 flex-shrink-0" />}
                          <span className={cn(
                            'text-sm truncate',
                            unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800',
                          )}>
                            {getConvName(conv)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] text-gray-400">
                            {conv.lastMessageAt ? formatConversationTime(conv.lastMessageAt) : ''}
                          </span>
                          {unread > 0 && (
                            <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold px-1.5">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={cn(
                        'text-xs truncate',
                        unread > 0 ? 'text-gray-600 font-medium' : 'text-gray-400',
                      )}>
                        {conv.lastMessagePreview || (conv.type === 'group' ? 'Group chat' : 'No messages yet')}
                      </p>
                    </div>
                  </Link>

                  {/* Pin on hover */}
                  <button
                    type="button"
                    aria-label={pinned ? 'Unpin' : 'Pin'}
                    onClick={(e) => { e.preventDefault(); pinConversation(conv._id, !pinned); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-brand-500 hover:bg-brand-50"
                  >
                    <Pin size={12} className={pinned ? 'fill-brand-400 text-brand-400' : ''} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UserSearchModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
    </div>
  );
}
