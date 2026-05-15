'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Users, MessageSquare, Bell, Group } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalConversations: number;
  totalGroups: number;
  pendingRequests?: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { admin, token } = useAdminAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin && !token) { router.replace('/admin/login'); return; }
    loadStats();
  }, [admin, token]);

  const loadStats = async () => {
    try {
      const [statsRes, reqRes] = await Promise.all([
        adminApi.get('/admin/dashboard'),
        adminApi.get('/admin/requests?status=pending&limit=1'),
      ]);
      setStats(statsRes.data);
      setPendingCount(reqRes.data.total || 0);
    } catch (err: any) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, href: '/admin/users', color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: Users, href: '/admin/users?status=active', color: 'text-green-600 bg-green-50' },
    { label: 'Pending Requests', value: pendingCount, icon: Bell, href: '/admin/requests', color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Total Conversations', value: stats?.totalConversations ?? 0, icon: MessageSquare, href: '/admin/chats', color: 'text-purple-600 bg-purple-50' },
    { label: 'Groups', value: stats?.totalGroups ?? 0, icon: Group, href: '/admin/groups', color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {admin?.name}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map(({ label, value, icon: Icon, href, color }) => (
              <Link key={label} href={href}
                className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pendingCount > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-yellow-600" size={20} />
              <span className="text-sm font-medium text-yellow-800">
                {pendingCount} access request{pendingCount !== 1 ? 's' : ''} waiting for review
              </span>
            </div>
            <Link href="/admin/requests" className="text-sm text-yellow-700 font-semibold hover:underline">
              Review →
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
