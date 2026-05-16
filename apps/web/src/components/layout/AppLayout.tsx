'use client';
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

  useSocket();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  // Hide the bottom nav when the user is inside a specific conversation so
  // the message input is the only bottom-anchored element (like WhatsApp).
  const isInConversation = /^\/app\/chats\/.+/.test(pathname);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-100">
      {/* Desktop left sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-16 bg-white border-r flex-col items-center py-3 gap-4 flex-shrink-0">
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
      <div className="flex-1 flex overflow-hidden min-h-0">
        {children}
      </div>

      {/* Mobile bottom nav — hidden on desktop, hidden inside conversations */}
      <nav className={`md:hidden flex-shrink-0 h-14 bg-white border-t flex items-center justify-around px-2 z-50 ${isInConversation ? 'hidden' : ''}`}>
        <Link href="/app/chats" className={cn('p-2.5 rounded-xl transition-colors', pathname.startsWith('/app/chats') ? 'text-brand-600' : 'text-gray-500')}>
          <MessageSquare size={22} />
        </Link>
        <Link href="/app/groups/create" className={cn('p-2.5 rounded-xl transition-colors', pathname === '/app/groups/create' ? 'text-brand-600' : 'text-gray-500')}>
          <Plus size={22} />
        </Link>
        <Link href="/app/settings" className={cn('p-2.5 rounded-xl transition-colors', pathname === '/app/settings' ? 'text-brand-600' : 'text-gray-500')}>
          <Settings size={22} />
        </Link>
        <Link href="/app/profile">
          {user && <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />}
        </Link>
        <button type="button" aria-label="Sign out" onClick={handleLogout} className="p-2.5 rounded-xl text-red-400">
          <LogOut size={22} />
        </button>
      </nav>
    </div>
  );
}
