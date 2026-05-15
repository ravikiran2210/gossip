import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import type { User } from '../types';

function setSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'user_session=1; path=/; max-age=2592000; SameSite=Lax';
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'user_session=; path=/; max-age=0; SameSite=Lax';
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  loginWithToken: (token: string, refreshToken: string, user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,

      login: async (emailOrUsername, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { emailOrUsername, password });
          if (typeof window !== 'undefined') {
            localStorage.setItem('userToken', data.accessToken);
            localStorage.setItem('userRefreshToken', data.refreshToken);
          }
          setSessionCookie();
          connectSocket(data.accessToken);
          set({ user: data.user, token: data.accessToken, refreshToken: data.refreshToken });
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithToken: (token, refreshToken, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userToken', token);
          localStorage.setItem('userRefreshToken', refreshToken);
        }
        setSessionCookie();
        connectSocket(token);
        set({ user, token, refreshToken });
      },

      setTokens: (token, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userToken', token);
          localStorage.setItem('userRefreshToken', refreshToken);
        }
        setSessionCookie();
        connectSocket(token);
        set({ token, refreshToken });
      },

      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userToken');
          localStorage.removeItem('userRefreshToken');
        }
        clearSessionCookie();
        disconnectSocket();
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: 'user-auth',
      partialize: (state) => ({ user: state.user, token: state.token, refreshToken: state.refreshToken }),
    },
  ),
);

// Listen for silent token refreshes performed by the api interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('token-refreshed', (e: Event) => {
    const { accessToken, refreshToken } = (e as CustomEvent<{ accessToken: string; refreshToken: string }>).detail;
    useAuthStore.getState().setTokens(accessToken, refreshToken);
  });
}
