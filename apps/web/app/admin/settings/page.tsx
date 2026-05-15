'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { admin, token } = useAdminAuthStore();
  useEffect(() => { if (!admin && !token) router.replace('/admin/login'); }, [admin, token]);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-500 text-sm">Admin settings. Extended in future phases.</p>
      </div>
    </AdminLayout>
  );
}
