'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '@/stores/admin-auth.store';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminMediaPage() {
  const router = useRouter();
  const { admin, token } = useAdminAuthStore();
  useEffect(() => { if (!admin && !token) router.replace('/admin/login'); }, [admin, token]);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Media</h1>
        <p className="text-gray-500 text-sm">Media management foundation. Extended in future phases.</p>
      </div>
    </AdminLayout>
  );
}
