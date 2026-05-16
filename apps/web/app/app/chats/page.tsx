'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageSquare } from 'lucide-react';

export default function ChatsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!user && !token) { router.replace('/user/verify-code'); return; }
    if (token) {
      const { connectSocket } = require('@/services/socket');
      connectSocket(token);
    }
  }, [user, token, router]);

  return (
    <AppLayout>
      <ConversationList />
      {/* Empty state — hidden on mobile (ConversationList fills the screen there) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-400 bg-gray-50">
        <MessageSquare size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Select a conversation</p>
        <p className="text-sm">or tap the compose icon to start a new one</p>
      </div>
    </AppLayout>
  );
}
