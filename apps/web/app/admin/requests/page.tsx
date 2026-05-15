'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/services/api';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { formatConversationTime } from '@/utils';
import type { AccessRequest } from '@/types';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Copy } from 'lucide-react';

export default function AdminRequestsPage() {
  const router = useRouter();
  const { admin, token } = useAdminAuthStore();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});
  const [reissueLoading, setReissueLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!admin && !token) { router.replace('/admin/login'); return; }
    loadRequests();
  }, [admin, token, activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get(`/admin/requests?status=${activeTab}&limit=20`);
      setRequests(data.requests);
    } finally {
      setLoading(false);
    }
  };

  const accept = async (id: string) => {
    setActionLoading(id);
    try {
      const { data } = await adminApi.post(`/admin/requests/${id}/accept`);
      toast.success(`Request accepted! Access code: ${data.rawCode}`, { duration: 10000 });
      setAccessCodes((prev) => ({ ...prev, [id]: data.rawCode }));
      loadRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.post(`/admin/requests/${id}/reject`);
      toast.success('Request rejected');
      loadRequests();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const reissue = async (id: string) => {
    setReissueLoading(id);
    try {
      const { data } = await adminApi.post(`/admin/requests/${id}/reissue`);
      setAccessCodes((prev) => ({ ...prev, [id]: data.rawCode }));
      toast.success('New code issued! Share it with the user.', { duration: 10000 });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reissue code');
    } finally {
      setReissueLoading(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied!');
    } catch {
      // Fallback for non-HTTPS or permission denied
      const el = document.createElement('textarea');
      el.value = code;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      if (ok) toast.success('Copied!');
      else toast.error('Copy failed — please copy manually');
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'accepted') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'rejected') return <XCircle size={16} className="text-red-500" />;
    return <Clock size={16} className="text-yellow-500" />;
  };

  const renderCodeBlock = (req: AccessRequest) => {
    const code = accessCodes[req._id] || req.accessCode?.rawCode || '';
    if (!code && req.status !== 'accepted') return null;
    const codeStatus = req.accessCode?.status;
    const colorClass =
      codeStatus === 'bound' ? 'bg-blue-50 border-blue-200 text-blue-700'
      : codeStatus === 'expired' ? 'bg-gray-50 border-gray-200 text-gray-500'
      : codeStatus === 'revoked' ? 'bg-red-50 border-red-200 text-red-600'
      : 'bg-green-50 border-green-200 text-green-700';
    const codeTextColor =
      codeStatus === 'bound' ? 'text-blue-800 bg-blue-100'
      : codeStatus === 'expired' ? 'text-gray-500 bg-gray-100'
      : codeStatus === 'revoked' ? 'text-red-700 bg-red-100'
      : 'text-green-800 bg-green-100';
    const statusLabel =
      codeStatus === 'bound' ? 'Used — user joined'
      : codeStatus ? codeStatus
      : null;
    return (
      <div className={`mt-3 p-3 border rounded-lg ${colorClass}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium">Access Code</p>
          {statusLabel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${colorClass}`}>
              {statusLabel}
            </span>
          )}
        </div>
        {code ? (
          <div className="flex items-center gap-2">
            <code className={`font-mono px-3 py-1 rounded text-sm font-bold tracking-wider ${codeTextColor}`}>
              {code}
            </code>
            <button
              type="button"
              onClick={() => copyCode(code)}
              className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        ) : (
          <p className="text-xs opacity-60 italic">Code not available (issued before history was tracked)</p>
        )}
        {req.status === 'accepted' && (
          <button
            type="button"
            onClick={() => reissue(req._id)}
            disabled={reissueLoading === req._id}
            className="mt-2 text-xs underline opacity-70 hover:opacity-100 disabled:opacity-40 cursor-pointer"
          >
            {reissueLoading === req._id ? 'Reissuing…' : 'Reissue new code for this user'}
          </button>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Access Requests</h1>

        <div className="flex gap-2 mb-6">
          {(['pending', 'accepted', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl p-4 h-20 animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">
            No {activeTab} requests
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req._id} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {statusIcon(req.status)}
                      <span className="font-medium text-gray-900">{req.name}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{req.email}</p>
                    {req.phone && <p className="text-xs text-gray-400">{req.phone}</p>}
                    {req.message && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{formatConversationTime(req.createdAt)}</p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => accept(req._id)}
                        isLoading={actionLoading === req._id}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => reject(req._id)}
                        isLoading={actionLoading === req._id}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>

                {renderCodeBlock(req)}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
