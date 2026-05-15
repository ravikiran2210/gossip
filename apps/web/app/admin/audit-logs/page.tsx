'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import type { AuditLog } from '@/types';
import { formatConversationTime } from '@/utils';

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const { admin, token } = useAdminAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin && !token) { router.replace('/admin/login'); return; }
    adminApi.get('/admin/audit-logs?limit=50')
      .then(({ data }) => setLogs(data.logs))
      .finally(() => setLoading(false));
  }, [admin, token]);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h1>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="bg-white rounded-xl h-12 animate-pulse" />)}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Action</th>
                  <th className="text-left p-3 font-medium text-gray-600">Actor</th>
                  <th className="text-left p-3 font-medium text-gray-600">Target</th>
                  <th className="text-left p-3 font-medium text-gray-600">When</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-700">{log.action}</td>
                    <td className="p-3 text-gray-500 capitalize">{log.actorType}</td>
                    <td className="p-3 text-gray-500">{log.targetType || '—'}</td>
                    <td className="p-3 text-gray-400 text-xs">{formatConversationTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && <div className="text-center p-8 text-gray-400">No logs yet</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
