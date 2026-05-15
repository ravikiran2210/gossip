'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import type { User } from '@/types';
import toast from 'react-hot-toast';
import { Search, X, Users } from 'lucide-react';

const schema = z.object({ title: z.string().min(2, 'Group name required') });
type FormData = z.infer<typeof schema>;

export default function CreateGroupPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { upsertConversation } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!user && !token) router.replace('/user/verify-code');
  }, [user, token]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.filter((u: User) => u._id !== user?._id));
    } finally {
      setSearching(false);
    }
  };

  const toggleUser = (u: User) => {
    setSelectedUsers((prev) =>
      prev.find((s) => s._id === u._id) ? prev.filter((s) => s._id !== u._id) : [...prev, u],
    );
  };

  const onSubmit = async (data: FormData) => {
    if (selectedUsers.length < 1) { toast.error('Add at least one member'); return; }
    try {
      const { data: conv } = await api.post('/conversations/group', {
        title: data.title,
        memberIds: selectedUsers.map((u) => u._id),
      });
      upsertConversation(conv);
      toast.success('Group created!');
      router.push(`/app/chats/${conv._id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create group');
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Users className="text-brand-600" size={22} />
            <h1 className="text-lg font-semibold text-gray-900">Create Group</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
            <Input label="Group Name" {...register('title')} error={errors.title?.message} autoFocus placeholder="e.g. Design Team" />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Members</label>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUsers.map((u) => (
                    <div key={u._id} className="flex items-center gap-1.5 bg-brand-100 text-brand-700 rounded-full px-3 py-1 text-sm">
                      <span>{u.name}</span>
                      <button type="button" aria-label={`Remove ${u.name}`} onClick={() => toggleUser(u)}><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => toggleUser(u)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUsers.find((s) => s._id === u._id) ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50'}`}
                  >
                    <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </div>
                    {selectedUsers.find((s) => s._id === u._id) && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full" disabled={selectedUsers.length === 0}>
              Create Group ({selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''})
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
