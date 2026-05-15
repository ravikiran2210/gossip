'use client';
import React, { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useChatStore } from '@/stores/chat.store';
import type { User } from '@/types';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSearchModal({ isOpen, onClose }: UserSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const router = useRouter();
  const { upsertConversation: upsertConv } = useChatStore();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    search(e.target.value);
  };

  const startChat = async (targetUserId: string) => {
    setStarting(targetUserId);
    try {
      const { data } = await api.post('/conversations/direct', { targetUserId });
      upsertConv(data);
      router.push(`/app/chats/${data._id}`);
      onClose();
    } finally {
      setStarting(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Chat">
      <div className="space-y-3">
        <Input
          value={query}
          onChange={handleSearch}
          placeholder="Search by name or username…"
          autoFocus
        />
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {loading && <p className="text-sm text-gray-400 text-center py-2">Searching…</p>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-sm text-gray-400 text-center py-2">No users found</p>
          )}
          {results.map((user) => (
            <div key={user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">@{user.username}</p>
              </div>
              <Button
                size="sm"
                onClick={() => startChat(user._id)}
                isLoading={starting === user._id}
              >
                Chat
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
