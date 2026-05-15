import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Separate axios instance used only for refresh calls — bypasses the 401 interceptor
const refreshApi = axios.create({ baseURL: API_URL });

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processPendingQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Only attempt refresh for 401s on user endpoints (not admin, not the refresh call itself)
    if (
      err.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !original._retried &&
      !original.url?.includes('/auth/refresh') &&
      !localStorage.getItem('adminToken')
    ) {
      const storedRefreshToken = localStorage.getItem('userRefreshToken');

      if (!storedRefreshToken) {
        // No refresh token — clear and let route guard redirect
        localStorage.removeItem('userToken');
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // Another refresh is already in progress — queue this request
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (newToken) => {
              original.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retried = true;
      isRefreshing = true;

      try {
        const { data } = await refreshApi.post('/auth/refresh', { refreshToken: storedRefreshToken });
        const { accessToken, refreshToken } = data;

        localStorage.setItem('userToken', accessToken);
        localStorage.setItem('userRefreshToken', refreshToken);

        // Notify the auth store to update its in-memory state
        window.dispatchEvent(
          new CustomEvent('token-refreshed', { detail: { accessToken, refreshToken } }),
        );

        processPendingQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processPendingQueue(refreshErr, null);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRefreshToken');
        window.dispatchEvent(new CustomEvent('auth-logout'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Admin 401 — clear admin token
    if (err.response?.status === 401 && typeof window !== 'undefined' && localStorage.getItem('adminToken')) {
      localStorage.removeItem('adminToken');
    }

    return Promise.reject(err);
  },
);

// Separate instance for admin calls
export const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
