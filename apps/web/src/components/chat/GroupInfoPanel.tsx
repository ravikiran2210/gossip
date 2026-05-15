'use client';
import React, { useState } from 'react';
import { api } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';
import type { Conversation, ConversationMember, User } from '@/types';
import { X, UserPlus, LogOut, UserMinus, Search, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GroupInfoPanelProps {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onConversationUpdate: (conv: Conversation) => void;
}

/** Extract string ID from either a populated User object or a raw string */
function getMemberId(m: ConversationMember): string {
  if (typeof m.userId === 'object' && m.userId !== null) {
    return (m.userId as any)._id?.toString() ?? '';
  }
  return String(m.userId ?? '');
}

/** Extract User object if populated, otherwise null */
function getMemberUser(m: ConversationMember): User | null {
  if (typeof m.userId === 'object' && m.userId !== null) {
    return m.userId as User;
  }
  return null;
}

export function GroupInfoPanel({ conversation, currentUserId, onClose, onConversationUpdate }: GroupInfoPanelProps) {
  const router = useRouter();
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const members = (conversation.members || []) as ConversationMember[];

  // Find the current user's membership — compare string IDs explicitly
  const currentMember = members.find(
    (m) => getMemberId(m) === currentUserId.toString(),
  );
  const currentRole = currentMember?.role;
  const isOwner = currentRole === 'owner';
  const isOwnerOrAdmin = currentRole === 'owner' || currentRole === 'admin';

  const handleAddSearch = async (q: string) => {
    setAddSearch(q);
    setError(null);
    if (q.trim().length < 2) { setAddResults([]); return; }
    setIsSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      // Filter out users already in the group
      const existingIds = new Set(members.map((m) => getMemberId(m)));
      setAddResults((data as User[]).filter((u) => !existingIds.has(u._id)));
    } catch {
      setAddResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (addingId) return;
    setAddingId(userId);
    setError(null);
    try {
      await api.post(`/groups/${conversation._id}/members`, { userIds: [userId] });
      setAddedIds((prev) => new Set([...prev, userId]));
      // Refresh conversation to show new member
      const { data } = await api.get(`/conversations/${conversation._id}`);
      onConversationUpdate(data);
      // Remove from results
      setAddResults((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the group?`)) return;
    setError(null);
    try {
      await api.delete(`/groups/${conversation._id}/members/${userId}`);
      const { data } = await api.get(`/conversations/${conversation._id}`);
      onConversationUpdate(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this group?')) return;
    try {
      await api.post(`/groups/${conversation._id}/leave`);
      router.replace('/app/chats');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to leave group');
    }
  };

  // Direct chat — show contact info only
  if (conversation.type === 'direct') {
    const other = conversation.otherUser;
    return (
      <div className="w-72 bg-white border-l flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Contact Info</h3>
          <button type="button" aria-label="Close panel" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 p-6">
          <Avatar name={other?.name || 'User'} avatarUrl={other?.avatarUrl} size="xl" />
          <p className="font-semibold text-gray-900 text-lg">{other?.name}</p>
          <p className="text-sm text-gray-500">@{other?.username}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-l flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900">Group Info</h3>
        <button type="button" aria-label="Close panel" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X size={18} />
        </button>
      </div>

      {/* Group avatar + name */}
      <div className="flex flex-col items-center gap-2 p-5 border-b">
        <Avatar name={conversation.title || 'Group'} avatarUrl={conversation.avatarUrl} size="xl" />
        <p className="font-semibold text-gray-900 text-lg">{conversation.title || 'Group'}</p>
        <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Error banner */}
      {error && (
        <p className="mx-3 mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Add member section — owner only */}
      {isOwner && (
        <div className="border-b p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserPlus size={12} /> Add member
          </p>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={addSearch}
              onChange={(e) => handleAddSearch(e.target.value)}
              placeholder="Search by name or username…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
            />
          </div>

          {isSearching && (
            <p className="text-xs text-gray-400 mt-1.5 px-1 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Searching…
            </p>
          )}

          {!isSearching && addSearch.trim().length >= 2 && addResults.length === 0 && (
            <p className="text-xs text-gray-400 mt-1.5 px-1">No users found</p>
          )}

          {addResults.length > 0 && (
            <div className="mt-1.5 max-h-40 overflow-y-auto border border-gray-100 rounded-lg bg-white shadow-sm divide-y divide-gray-50">
              {addResults.map((u) => {
                const isAdding = addingId === u._id;
                const isAdded = addedIds.has(u._id);
                return (
                  <button
                    key={u._id}
                    type="button"
                    disabled={!!addingId || isAdded}
                    onClick={() => handleAddMember(u._id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-brand-50 disabled:opacity-60 transition-colors text-left"
                  >
                    <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </div>
                    {isAdding ? (
                      <Loader2 size={14} className="animate-spin text-brand-500 flex-shrink-0" />
                    ) : isAdded ? (
                      <Check size={14} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <UserPlus size={14} className="text-brand-500 flex-shrink-0 opacity-70" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2">Members</p>
        {members.map((m) => {
          const u = getMemberUser(m);
          const uid = getMemberId(m);
          const isMe = uid === currentUserId;
          const displayName = u?.name || u?.username || uid.slice(-6);
          return (
            <div key={m._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group">
              <Avatar name={displayName} avatarUrl={u?.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {displayName}{isMe ? ' (you)' : ''}
                </p>
                <p className="text-xs text-gray-400 capitalize">{m.role}</p>
              </div>
              {isOwnerOrAdmin && !isMe && m.role !== 'owner' && (
                <button
                  type="button"
                  aria-label={`Remove ${displayName}`}
                  onClick={() => handleRemoveMember(uid, displayName)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Leave group — owner sees a hint instead */}
      <div className="border-t p-3">
        {isOwner ? (
          <p className="text-xs text-gray-400 text-center">You are the group owner</p>
        ) : (
          <button
            type="button"
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} /> Leave group
          </button>
        )}
      </div>
    </div>
  );
}
