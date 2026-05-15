'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChatStore } from '@/stores/chat.store';
import { Avatar } from '@/components/ui/Avatar';
import { formatConversationTime } from '@/utils';
import { cn } from '@/utils';
import { Search, Plus, Pin } from 'lucide-react';
import type { Conversation } from '@/types';

export function ConversationList() {
  const pathname = usePathname();
  const { conversations, loadConversations, isLoadingConversations, onlineUsers, pinConversation } = useChatStore();
  const [search, setSearch] = useState('');

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
    const name = getConvName(c).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <Link href="/app/groups/create" className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg" aria-label="New group">
            <Plus size={20} />
          </Link>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations && conversations.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
            <p>{search ? 'No results' : 'No conversations yet'}</p>
            {!search && <p className="text-xs">Search for a user to start chatting</p>}
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = pathname.includes(conv._id);
            const online = isOtherUserOnline(conv);
            const unread = conv.unreadCount || 0;
            const pinned = !!conv.pinnedAt;

            return (
              <div key={conv._id} className="group relative">
                <Link
                  href={`/app/chats/${conv._id}`}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50',
                    isActive && 'bg-brand-50',
                  )}
                >
                  <Avatar
                    name={getConvName(conv)}
                    avatarUrl={getConvAvatar(conv)}
                    size="md"
                    isOnline={online}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        {pinned && <Pin size={11} className="text-brand-400 flex-shrink-0" />}
                        <span className={cn('text-sm truncate', unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-800')}>
                          {getConvName(conv)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {conv.lastMessageAt && (
                          <span className="text-xs text-gray-400">
                            {formatConversationTime(conv.lastMessageAt)}
                          </span>
                        )}
                        {unread > 0 && (
                          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold px-1">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.lastMessagePreview || (conv.type === 'group' ? 'Group chat' : 'Direct message')}
                    </p>
                  </div>
                </Link>

                {/* Pin / unpin context action — visible on hover */}
                <button
                  type="button"
                  aria-label={pinned ? 'Unpin conversation' : 'Pin conversation'}
                  onClick={(e) => { e.preventDefault(); pinConversation(conv._id, !pinned); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-brand-500 hover:bg-gray-100"
                >
                  <Pin size={13} className={pinned ? 'fill-brand-400 text-brand-400' : ''} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
