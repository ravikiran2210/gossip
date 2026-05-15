import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminApi } from '../services/api';
import type { AdminUser } from '../types';

function setAdminCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'admin_session=1; path=/; max-age=86400; SameSite=Lax';
}

function clearAdminCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'admin_session=; path=/; max-age=0; SameSite=Lax';
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  setAdmin: (admin: AdminUser) => void;
  setHasHydrated: (val: boolean) => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      login: async (emailOrUsername, password) => {
        set({ isLoading: true });
        try {
          const { data } = await adminApi.post('/admin/auth/login', { emailOrUsername, password });
          if (typeof window !== 'undefined') {
            localStorage.setItem('adminToken', data.accessToken);
          }
          setAdminCookie();
          set({ admin: data.admin, token: data.accessToken });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('adminToken');
        clearAdminCookie();
        set({ admin: null, token: null });
      },

      setAdmin: (admin) => set({ admin }),
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ admin: state.admin, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
