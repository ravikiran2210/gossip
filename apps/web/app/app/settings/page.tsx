'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LogOut, User, Bell, Moon, Sun, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!user && !token) { router.replace('/user/verify-code'); return; }
    // Restore preferences from localStorage
    const savedDark = localStorage.getItem('darkMode');
    const savedNotif = localStorage.getItem('notifications');
    if (savedDark !== null) setDarkMode(savedDark === 'true');
    if (savedNotif !== null) setNotifications(savedNotif === 'true');
  }, [user, token]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    // Toggle Tailwind dark class on <html>
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('notifications', String(next));
    if (next && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col bg-gray-50 p-6">
        <div className="max-w-md mx-auto w-full space-y-5">
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>

          {/* Profile card */}
          <Link href="/app/profile" className="block bg-white rounded-2xl p-4 shadow-sm border hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <p className="text-xs text-brand-600 mt-0.5">Edit profile</p>
              </div>
              <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
            </div>
          </Link>

          {/* Preferences */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pt-4 pb-2">Preferences</p>

            {/* Dark mode */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={18} className="text-brand-500" /> : <Sun size={18} className="text-amber-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">Dark mode</p>
                  <p className="text-xs text-gray-400">{darkMode ? 'On' : 'Off'}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label={darkMode ? 'Disable dark mode' : 'Enable dark mode'}
                onClick={toggleDarkMode}
                className={`relative w-10 h-6 rounded-full transition-colors ${darkMode ? 'bg-brand-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${darkMode ? 'left-5' : 'left-1'}`} />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Bell size={18} className={notifications ? 'text-brand-500' : 'text-gray-400'} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-400">{notifications ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label={notifications ? 'Disable notifications' : 'Enable notifications'}
                onClick={toggleNotifications}
                className={`relative w-10 h-6 rounded-full transition-colors ${notifications ? 'bg-brand-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifications ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 pt-4 pb-2">Account</p>
            <Link href="/app/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b transition-colors">
              <User size={18} className="text-gray-400" />
              <span className="text-sm text-gray-900 flex-1">Edit Profile</span>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut size={18} className="text-red-500" />
              <span className="text-sm text-red-600 flex-1">Sign Out</span>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">Messenger v1.0</p>
        </div>
      </div>
    </AppLayout>
  );
}
