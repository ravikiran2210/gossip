'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import type { Conversation } from '@/types';
import { formatConversationTime } from '@/utils';

export default function AdminGroupsPage() {
  const router = useRouter();
  const { admin, token } = useAdminAuthStore();
  const [groups, setGroups] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin && !token) { router.replace('/admin/login'); return; }
    adminApi.get('/admin/groups?limit=50')
      .then(({ data }) => setGroups(data.groups))
      .finally(() => setLoading(false));
  }, [admin, token]);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Groups</h1>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />)}</div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">No groups yet</div>
        ) : (
          <div className="grid gap-3">
            {groups.map((g) => (
              <div key={g._id} className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                  {g.title?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{g.title || 'Unnamed Group'}</p>
                  {g.lastMessageAt && <p className="text-xs text-gray-400">{formatConversationTime(g.lastMessageAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
