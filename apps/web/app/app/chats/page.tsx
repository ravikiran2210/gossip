'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { UserSearchModal } from '@/features/chat/UserSearchModal';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Search } from 'lucide-react';

export default function ChatsPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!user && !token) { router.replace('/user/verify-code'); return; }
    // Reconnect socket if token exists
    if (token) {
      const { connectSocket } = require('@/services/socket');
      connectSocket(token);
    }
  }, [user, token, router]);

  return (
    <AppLayout>
      <ConversationList />
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-400 bg-gray-50">
        <MessageSquare size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Select a conversation</p>
        <p className="text-sm mb-6">or start a new one</p>
        <Button onClick={() => setShowSearch(true)} size="sm" variant="secondary">
          <Search size={16} className="mr-2" /> Find someone to chat
        </Button>
      </div>

      <UserSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </AppLayout>
  );
}
