import { create } from 'zustand';
import api, { setAccessToken } from '@/lib/api';

interface AuthUser {
  id: number;
  username: string;
  roleId: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/api/v1/auth/login', { username, password });
      setAccessToken(data.accessToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      setAccessToken(null);
      set({ user: null, isAuthenticated: false });
    }
  },

  setAuth: (user, token) => {
    setAccessToken(token);
    set({ user, isAuthenticated: true });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false });
  },
}));
