'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { cn } from '@/utils';
import {
  LayoutDashboard, Users, MessageSquare, Shield, FileText,
  Settings, LogOut, Bell, Group, Image,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/requests', label: 'Requests', icon: Bell },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/groups', label: 'Groups', icon: Group },
  { href: '/admin/chats', label: 'Chats', icon: MessageSquare },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, token, _hasHydrated, logout } = useAdminAuthStore();

  useEffect(() => {
    if (_hasHydrated && !admin && !token) {
      router.replace('/admin/login');
    }
  }, [_hasHydrated, admin, token]);

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  // Wait for localStorage to rehydrate before rendering — prevents false redirect on refresh
  if (!_hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin && !token) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="text-brand-600" size={24} />
            <span className="font-bold text-lg text-gray-900">Messenger Admin</span>
          </div>
          {admin && <p className="text-xs text-gray-500 mt-1 truncate">{admin.email}</p>}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === href
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
