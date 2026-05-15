'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

// Runs on every page load. If Zustand has a token in localStorage but the
// session cookie is missing (cleared by browser, or pre-cookie deploy), this
// restores the cookie so the middleware stops redirecting the user.
export function SessionSync() {
  useEffect(() => {
    const { token } = useAuthStore.getState();
    if (token) {
      document.cookie = 'user_session=1; path=/; max-age=2592000; SameSite=Lax';
    }
  }, []);

  return null;
}
