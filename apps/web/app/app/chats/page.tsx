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
      {/* Empty state — desktop only */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] gap-3">
        <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center">
          <MessageSquare size={36} className="text-brand-400" />
        </div>
        <p className="text-lg font-bold text-gray-600">Start gossiping</p>
        <p className="text-sm text-gray-400">Select a chat or tap the compose icon to start one</p>
      </div>
    </AppLayout>
  );
}
