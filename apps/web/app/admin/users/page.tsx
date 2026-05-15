'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const { admin, token } = useAdminAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin && !token) { router.replace('/admin/login'); return; }
    loadUsers();
  }, [admin, token]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/users?limit=50');
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'active' | 'suspended' | 'blocked') => {
    try {
      await adminApi.patch(`/admin/users/${id}/status`, { status });
      toast.success(`User ${status}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    }
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'text-green-600 bg-green-50' : s === 'suspended' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />)}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">User</th>
                  <th className="text-left p-3 font-medium text-gray-600">Username</th>
                  <th className="text-left p-3 font-medium text-gray-600">Email</th>
                  <th className="text-left p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500">@{user.username}</td>
                    <td className="p-3 text-gray-500">{user.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {user.status !== 'active' && (
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(user._id, 'active')}>Activate</Button>
                        )}
                        {user.status === 'active' && (
                          <Button size="sm" variant="danger" onClick={() => updateStatus(user._id, 'suspended')}>Suspend</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center p-8 text-gray-400">No users found</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
