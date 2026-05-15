'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth.store';
import { useAdminAuthStore } from '../stores/admin-auth.store';

export function useUserAuth() {
  const store = useAuthStore();
  const router = useRouter();

  const requireAuth = () => {
    if (!store.user && !store.token) {
      router.replace('/user/verify-code');
      return false;
    }
    return true;
  };

  return { ...store, requireAuth };
}

export function useAdminAuth() {
  const store = useAdminAuthStore();
  const router = useRouter();

  const requireAuth = () => {
    if (!store.admin && !store.token) {
      router.replace('/admin/login');
      return false;
    }
    return true;
  };

  return { ...store, requireAuth };
}
