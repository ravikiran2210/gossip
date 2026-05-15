'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils';
import { MessageSquare, Settings, LogOut, Plus } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Initialize socket event listeners
  useSocket();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar */}
      <aside className="w-16 bg-white border-r flex flex-col items-center py-3 gap-4">
        <Link href="/app/chats" className={cn('p-2.5 rounded-xl transition-colors', pathname.startsWith('/app/chats') ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100')}>
          <MessageSquare size={22} />
        </Link>
        <Link href="/app/groups/create" className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <Plus size={22} />
        </Link>
        <div className="flex-1" />
        <Link href="/app/settings" className={cn('p-2.5 rounded-xl transition-colors', pathname === '/app/settings' ? 'bg-brand-100 text-brand-700' : 'text-gray-500 hover:bg-gray-100')}>
          <Settings size={22} />
        </Link>
        <Link href="/app/profile">
          {user && <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />}
        </Link>
        <button type="button" aria-label="Sign out" onClick={handleLogout} className="p-2.5 rounded-xl text-red-400 hover:bg-red-50 transition-colors">
          <LogOut size={22} />
        </button>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {children}
      </div>
    </div>
  );
}
