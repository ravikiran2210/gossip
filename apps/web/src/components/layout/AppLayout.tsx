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

  const isInConversation = /^\/app\/chats\/.+/.test(pathname);

  const navItems = [
    { href: '/app/chats', icon: MessageSquare, label: 'Chats' },
    { href: '/app/groups/create', icon: Plus, label: 'New Group' },
    { href: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-100">
      {/* Desktop left sidebar */}
      <aside className="hidden md:flex w-16 bg-white border-r flex-col items-center py-4 gap-2 flex-shrink-0 shadow-sm">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/app/chats' ? pathname.startsWith('/app/chats') : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-2xl transition-all',
                active
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                  : 'text-gray-400 hover:bg-brand-50 hover:text-brand-500',
              )}
            >
              <Icon size={20} />
            </Link>
          );
        })}

        <div className="flex-1" />

        <Link href="/app/profile" title="Profile">
          {user && <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />}
        </Link>
        <button
          type="button"
          title="Sign out"
          aria-label="Sign out"
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={20} />
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <nav className={cn(
        'md:hidden flex-shrink-0 bg-white border-t flex items-center justify-around px-3 z-50 pb-safe',
        isInConversation ? 'hidden' : 'h-16',
      )}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/app/chats' ? pathname.startsWith('/app/chats') : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 relative px-3 py-1"
            >
              <div className={cn(
                'w-10 h-10 flex items-center justify-center rounded-2xl transition-all',
                active ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-gray-400',
              )}>
                <Icon size={20} />
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-brand-500' : 'text-gray-400')}>
                {label}
              </span>
            </Link>
          );
        })}
        <Link href="/app/profile" className="flex flex-col items-center gap-1 px-3 py-1">
          <div className="w-10 h-10 flex items-center justify-center">
            {user && <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />}
          </div>
          <span className="text-[10px] font-medium text-gray-400">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
